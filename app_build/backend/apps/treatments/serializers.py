from rest_framework import serializers
from .models import Tratamiento, Seguimiento


class TratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seguimiento
        fields = [
            'id', 'fecha', 'hora', 'precio',
            'id_paciente', 'id_tratamiento', 'id_medicamento',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
