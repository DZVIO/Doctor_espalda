from rest_framework import serializers
from .models import FormaFarmaceutica, UnidadMedida, Marca, Presentacion, Medicamento

class FormaFarmaceuticaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaFarmaceutica
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class PresentacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presentacion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['forma_farmaceutica_detalle'] = FormaFarmaceuticaSerializer(instance.forma_farmaceutica).data if instance.forma_farmaceutica else None
        response['unidad_medida_detalle'] = UnidadMedidaSerializer(instance.unidad_medida).data if instance.unidad_medida else None
        return response

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
            'id', 'nombre', 'descripcion', 'marca', 'presentacion',
            'cantidad', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['marca_detalle'] = MarcaSerializer(instance.marca).data if instance.marca else None
        response['presentacion_detalle'] = PresentacionSerializer(instance.presentacion).data if instance.presentacion else None
        return response
