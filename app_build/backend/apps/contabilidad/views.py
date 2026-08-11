import zoneinfo
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Pago
from .serializers import (
    PagoSerializer,
    ConfirmarPagoSerializer,
    PagarCompletoSerializer
)
from .services import PagoService


class PagoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PagoSerializer

    def get_queryset(self):
        queryset = Pago.objects.select_related(
            'id_sesion',
            'id_sesion__id_paciente'
        ).prefetch_related(
            'id_sesion__detalles',
            'id_sesion__detalles__id_tratamiento',
            'id_sesion__detalles__id_medicamento'
        ).all()

        estado_pago = self.request.query_params.get('estado_pago')
        if estado_pago:
            queryset = queryset.filter(estado_pago=estado_pago)

        id_sesion = self.request.query_params.get('id_sesion')
        if id_sesion:
            queryset = queryset.filter(id_sesion_id=id_sesion)

        fecha_pago_desde = self.request.query_params.get('fecha_pago_desde')
        if fecha_pago_desde:
            queryset = queryset.filter(fecha_pago__date__gte=fecha_pago_desde)

        fecha_pago_hasta = self.request.query_params.get('fecha_pago_hasta')
        if fecha_pago_hasta:
            queryset = queryset.filter(fecha_pago__date__lte=fecha_pago_hasta)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(id_sesion__id_paciente__nombre__icontains=search) |
                models.Q(id_sesion__id_paciente__apellido__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['patch'], url_path='confirmar')
    def confirmar(self, request, pk=None):
        serializer = ConfirmarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            pago = PagoService.confirmar_pago(
                id_pago=pk,
                metodo_pago=serializer.validated_data['metodo_pago'],
                monto_pagado=serializer.validated_data['monto_pagado'],
                observaciones=serializer.validated_data.get('observaciones')
            )
            return Response(PagoSerializer(pago).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='pagar_completo')
    def pagar_completo(self, request, pk=None):
        serializer = PagarCompletoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            pago = PagoService.marcar_pagado_completo(
                id_pago=pk,
                metodo_pago=serializer.validated_data['metodo_pago']
            )
            return Response(PagoSerializer(pago).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_metricas_financieras(request):
    tz_bogota = zoneinfo.ZoneInfo("America/Bogota")
    now_bogota = timezone.now().astimezone(tz_bogota)

    # Calculate dates relative to Bogotá local timezone
    start_today = datetime.combine(now_bogota.date(), time.min).replace(tzinfo=tz_bogota)
    end_today = datetime.combine(now_bogota.date(), time.max).replace(tzinfo=tz_bogota)

    start_week = start_today - timedelta(days=6)
    start_month = datetime(now_bogota.year, now_bogota.month, 1).replace(tzinfo=tz_bogota)

    # 1. total_ingresos_hoy
    total_ingresos_hoy = Pago.objects.filter(
        fecha_pago__range=(start_today, end_today)
    ).aggregate(total=models.Sum('monto_pagado'))['total'] or Decimal('0.00')

    # 2. total_ingresos_semana
    total_ingresos_semana = Pago.objects.filter(
        fecha_pago__range=(start_week, end_today)
    ).aggregate(total=models.Sum('monto_pagado'))['total'] or Decimal('0.00')

    # 3. total_ingresos_mes
    total_ingresos_mes = Pago.objects.filter(
        fecha_pago__range=(start_month, end_today)
    ).aggregate(total=models.Sum('monto_pagado'))['total'] or Decimal('0.00')

    # 4. total_pendiente (suma de todos los saldos pendientes de pagos en estado pendiente o parcial)
    total_pendiente = Pago.objects.filter(
        estado_pago__in=['pendiente', 'parcial']
    ).aggregate(total=models.Sum('saldo_pendiente'))['total'] or Decimal('0.00')

    # 5. cantidad_pendientes
    cantidad_pendientes = Pago.objects.filter(estado_pago='pendiente').count()

    # 6. ingresos_por_dia (last 30 days)
    start_30_days = start_today - timedelta(days=29)
    pagos_30 = Pago.objects.filter(fecha_pago__range=(start_30_days, end_today))

    ingresos_dict = {}
    for i in range(30):
        day = (start_today - timedelta(days=i)).date()
        ingresos_dict[day.strftime('%Y-%m-%d')] = Decimal('0.00')

    for p in pagos_30:
        if p.fecha_pago:
            p_local = p.fecha_pago.astimezone(tz_bogota)
            p_date_str = p_local.strftime('%Y-%m-%d')
            if p_date_str in ingresos_dict:
                ingresos_dict[p_date_str] += p.monto_pagado

    ingresos_por_dia = [
        {"fecha": date_str, "total": float(total)}
        for date_str, total in sorted(ingresos_dict.items())
    ]

    # 7. distribucion_metodo_pago
    distribucion = Pago.objects.exclude(metodo_pago=None).values('metodo_pago').annotate(
        cantidad=models.Count('id'),
        total=models.Sum('monto_pagado')
    )

    metodos = ['efectivo', 'transferencia', 'tarjeta', 'otro']
    dist_dict = {m: {"metodo_pago": m, "cantidad": 0, "total": 0.0} for m in metodos}

    for item in distribucion:
        m = item['metodo_pago']
        if m in dist_dict:
            dist_dict[m]['cantidad'] = item['cantidad']
            dist_dict[m]['total'] = float(item['total'] or Decimal('0.00'))

    distribucion_metodo_pago = list(dist_dict.values())

    return Response({
        "total_ingresos_hoy": float(total_ingresos_hoy),
        "total_ingresos_semana": float(total_ingresos_semana),
        "total_ingresos_mes": float(total_ingresos_mes),
        "total_pendiente": float(total_pendiente),
        "cantidad_pendientes": cantidad_pendientes,
        "ingresos_por_dia": ingresos_por_dia,
        "distribucion_metodo_pago": distribucion_metodo_pago
    }, status=status.HTTP_200_OK)
