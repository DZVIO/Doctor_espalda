from rest_framework import serializers
from .models import Tratamiento, Seguimiento, DetalleSeguimiento
from apps.inventory.models import Medicamento

class TratamientoSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if 'precio' in data and data['precio'] <= 0:
            raise serializers.ValidationError({"error": "El campo precio no puede ser negativo o cero."})
        return data

    class Meta:
        model = Tratamiento
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class MedicamentoMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = ['id', 'nombre', 'precio']

class TratamientoMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = ['id', 'nombre', 'precio']

class DetalleSeguimientoSerializer(serializers.ModelSerializer):
    medicamento_detalle = MedicamentoMiniSerializer(source='id_medicamento', read_only=True)
    tratamiento_detalle = TratamientoMiniSerializer(source='id_tratamiento', read_only=True)

    def validate(self, data):
        if 'cantidad' in data and data['cantidad'] <= 0:
            raise serializers.ValidationError({"error": "El campo cantidad no puede ser negativo o cero."})
        return data

    class Meta:
        model = DetalleSeguimiento
        fields = [
            'id', 'id_venta', 'id_tratamiento', 'id_medicamento',
            'cantidad', 'tratamiento_detalle', 'medicamento_detalle',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'id_venta', 'created_at', 'updated_at']


class SeguimientoSerializer(serializers.ModelSerializer):
    detalles = DetalleSeguimientoSerializer(many=True, read_only=True)

    class Meta:
        model = Seguimiento
        fields = [
            'id', 'fecha', 'hora', 'total',
            'id_paciente', 'detalles',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total', 'created_at', 'updated_at']
