from rest_framework import serializers
from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if 'cantidad' in data and data['cantidad'] < 0:
            raise serializers.ValidationError({"error": "El campo cantidad no puede ser negativo o cero."})
        if 'precio' in data and data['precio'] <= 0:
            raise serializers.ValidationError({"error": "El campo precio no puede ser negativo o cero."})
        return data

    class Meta:
        model = Medicamento
        fields = [
            'id', 'nombre', 'descripcion', 'presentacion',
            'unidad_medida', 'cantidad', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
