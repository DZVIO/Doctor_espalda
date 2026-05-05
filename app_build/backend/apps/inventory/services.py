from django.db import IntegrityError
from django.db.models import RestrictedError
from .models import Medicamento


class MedicamentoService:

    @staticmethod
    def create_medicamento(validated_data):
        try:
            return Medicamento.objects.create(**validated_data)
        except IntegrityError:
            raise ValueError(
                "Ya existe un medicamento con esa combinación de nombre, presentación y unidad de medida."
            )

    @staticmethod
    def update_medicamento(instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            if instance.cantidad == 0:
                instance.estado = 'inactivo'

            instance.save()
            return instance
        except IntegrityError:
            raise ValueError(
                "Ya existe un medicamento con esa combinación de nombre, presentación y unidad de medida."
            )

    @staticmethod
    def delete_medicamento(instance):
        try:
            instance.delete()
        except (IntegrityError, RestrictedError):
            raise ValueError(
                "No se puede eliminar este medicamento porque tiene registros de seguimiento asociados."
            )
