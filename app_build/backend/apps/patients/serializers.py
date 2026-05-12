from rest_framework import serializers
from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = [
            'id', 'nombre', 'apellido', 'cedula', 'correo',
            'numero', 'region', 'estado', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_correo(self, value):
        if value:
            queryset = Paciente.objects.filter(correo=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ya existe un paciente con ese correo.")
        return value
