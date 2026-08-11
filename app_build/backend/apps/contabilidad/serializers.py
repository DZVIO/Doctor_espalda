from rest_framework import serializers
from .models import Pago
from apps.treatments.models import Sesion, DetalleSesion
from apps.patients.models import Paciente

class PacienteMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = ['id', 'nombre', 'apellido', 'cedula']

class DetalleSesionMiniSerializer(serializers.ModelSerializer):
    tratamiento_nombre = serializers.CharField(source='id_tratamiento.nombre', read_only=True)
    medicamento_nombre = serializers.CharField(source='id_medicamento.nombre', read_only=True)

    class Meta:
        model = DetalleSesion
        fields = ['id', 'tratamiento_nombre', 'medicamento_nombre', 'cantidad']

class SesionPagoSerializer(serializers.ModelSerializer):
    id_paciente = PacienteMiniSerializer(read_only=True)
    detalles = DetalleSesionMiniSerializer(many=True, read_only=True)

    class Meta:
        model = Sesion
        fields = ['id', 'fecha', 'hora', 'total', 'id_paciente', 'detalles']

class PagoSerializer(serializers.ModelSerializer):
    sesion = SesionPagoSerializer(source='id_sesion', read_only=True)

    class Meta:
        model = Pago
        fields = [
            'id',
            'id_sesion',
            'sesion',
            'metodo_pago',
            'estado_pago',
            'monto_pagado',
            'saldo_pendiente',
            'fecha_pago',
            'observaciones',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'estado_pago',
            'monto_pagado',
            'saldo_pendiente',
            'fecha_pago',
            'created_at',
            'updated_at',
        ]

class ConfirmarPagoSerializer(serializers.Serializer):
    metodo_pago = serializers.ChoiceField(choices=Pago.METODO_PAGO_CHOICES)
    monto_pagado = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

class PagarCompletoSerializer(serializers.Serializer):
    metodo_pago = serializers.ChoiceField(choices=Pago.METODO_PAGO_CHOICES)
