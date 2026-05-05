from django.db import IntegrityError
from django.db.models import RestrictedError
from .models import Paciente


class PacienteService:

    @staticmethod
    def create_paciente(validated_data):
        try:
            return Paciente.objects.create(**validated_data)
        except IntegrityError:
            raise ValueError("Ya existe un paciente con esa cédula.")

    @staticmethod
    def update_paciente(instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except IntegrityError:
            raise ValueError("Ya existe un paciente con esa cédula.")

    @staticmethod
    def delete_paciente(instance):
        try:
            instance.delete()
        except (IntegrityError, RestrictedError):
            raise ValueError(
                "No se puede eliminar este paciente porque tiene agendamientos o seguimientos asociados."
            )
