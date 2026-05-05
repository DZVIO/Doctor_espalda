from rest_framework import serializers
from .models import Agendamiento


class AgendamientoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Agendamiento
        fields = [
            'id', 'fecha', 'hora_ingreso', 'hora_salida',
            'id_paciente', 'paciente_nombre', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_paciente_nombre(self, obj):
        return f"{obj.id_paciente.nombre} {obj.id_paciente.apellido}"

    def validate(self, data):
        if self.instance:
            if ('hora_ingreso' in data) != ('hora_salida' in data):
                raise serializers.ValidationError(
                    "hora_ingreso y hora_salida deben actualizarse juntos."
                )
        return data
