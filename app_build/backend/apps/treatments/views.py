from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import Tratamiento, Seguimiento, DetalleSeguimiento
from .serializers import TratamientoSerializer, SeguimientoSerializer, DetalleSeguimientoSerializer
from .services import TratamientoService, SeguimientoService, DetalleSeguimientoService


class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['estado']
    search_fields = ['nombre']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tratamiento = TratamientoService.create_tratamiento(serializer.validated_data)
            output = self.get_serializer(tratamiento)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        try:
            tratamiento = TratamientoService.update_tratamiento(instance, serializer.validated_data)
            output = self.get_serializer(tratamiento)
            return Response(output.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            TratamientoService.delete_tratamiento(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SeguimientoViewSet(viewsets.ModelViewSet):
    queryset = Seguimiento.objects.prefetch_related('detalles').all()
    serializer_class = SeguimientoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id_paciente', 'fecha']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            seguimiento = SeguimientoService.create_seguimiento(serializer.validated_data)
            output = self.get_serializer(seguimiento)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        try:
            seguimiento = SeguimientoService.update_seguimiento(instance, serializer.validated_data)
            output = self.get_serializer(seguimiento)
            return Response(output.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            SeguimientoService.delete_seguimiento(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='detalles')
    def add_detalle(self, request, pk=None):
        seguimiento = self.get_object()
        serializer = DetalleSeguimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            detalle = DetalleSeguimientoService.create_detalle(seguimiento, serializer.validated_data)
            output = DetalleSeguimientoSerializer(detalle)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path=r'detalles/(?P<det_id>[^/.]+)')
    def remove_detalle(self, request, pk=None, det_id=None):
        seguimiento = self.get_object()
        try:
            detalle = DetalleSeguimiento.objects.get(id=det_id, id_venta=seguimiento)
            DetalleSeguimientoService.delete_detalle(detalle)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DetalleSeguimiento.DoesNotExist:
            return Response({"error": "Detalle no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
