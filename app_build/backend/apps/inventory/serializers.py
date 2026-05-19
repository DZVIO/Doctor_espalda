from rest_framework import serializers
from .models import FormaFarmaceutica, UnidadMedida, Marca, Presentacion, Medicamento, Categoria

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

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class PresentacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presentacion
        fields = ['id', 'forma_farmaceutica', 'concentracion', 'unidad_medida', 'estado', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['forma_farmaceutica_detalle'] = FormaFarmaceuticaSerializer(instance.forma_farmaceutica).data if instance.forma_farmaceutica else None
        response['unidad_medida_detalle'] = UnidadMedidaSerializer(instance.unidad_medida).data if instance.unidad_medida else None
        return response

class MedicamentoSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if 'stock' in data and data['stock'] < 0:
            raise serializers.ValidationError({"error": "El campo stock no puede ser negativo o cero."})
        if 'precio' in data and data['precio'] <= 0:
            raise serializers.ValidationError({"error": "El campo precio no puede ser negativo o cero."})
        return data

    class Meta:
        model = Medicamento
        fields = [
            'id', 'nombre', 'descripcion', 'marca', 'categoria', 'presentacion',
            'stock', 'precio', 'estado',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['marca_detalle'] = MarcaSerializer(instance.marca).data if instance.marca else None
        response['categoria_detalle'] = CategoriaSerializer(instance.categoria).data if instance.categoria else None
        response['presentacion_detalle'] = PresentacionSerializer(instance.presentacion).data if instance.presentacion else None
        return response
