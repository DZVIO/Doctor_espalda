from rest_framework import serializers
from .models import Tratamiento, Sesion, DetalleSesion
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

class DetalleSesionSerializer(serializers.ModelSerializer):
    medicamento_detalle = MedicamentoMiniSerializer(source='id_medicamento', read_only=True)
    tratamiento_detalle = TratamientoMiniSerializer(source='id_tratamiento', read_only=True)

    def validate(self, data):
        if 'cantidad' in data and data['cantidad'] <= 0:
            raise serializers.ValidationError({"error": "El campo cantidad no puede ser negativo o cero."})
        return data

    class Meta:
        model = DetalleSesion
        fields = [
            'id', 'id_sesion', 'id_tratamiento', 'id_medicamento',
            'cantidad', 'tratamiento_detalle', 'medicamento_detalle',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'id_sesion', 'created_at', 'updated_at']


class SesionSerializer(serializers.ModelSerializer):
    detalles = DetalleSesionSerializer(many=True, read_only=True)
    estado_pago = serializers.SerializerMethodField()
    saldo_pendiente = serializers.SerializerMethodField()

    def get_estado_pago(self, obj):
        if hasattr(obj, 'pago'):
            return obj.pago.estado_pago
        return 'sin_pago'

    def get_saldo_pendiente(self, obj):
        if hasattr(obj, 'pago'):
            return str(obj.pago.saldo_pendiente)
        return '0.00'

    class Meta:
        model = Sesion
        fields = [
            'id', 'fecha', 'hora', 'total',
            'id_paciente', 'id_agendamiento', 'detalles',
            'estado_pago', 'saldo_pendiente', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total', 'estado_pago', 'saldo_pendiente', 'created_at', 'updated_at']
