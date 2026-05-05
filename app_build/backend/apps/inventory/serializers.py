from rest_framework import serializers
from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = [
            'id', 'nombre', 'descripcion', 'presentacion',
            'unidad_medida', 'cantidad', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
