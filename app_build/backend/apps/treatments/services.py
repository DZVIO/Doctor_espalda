from django.db import IntegrityError, transaction
from django.db.models import RestrictedError
from .models import Tratamiento, Seguimiento
from apps.inventory.models import Medicamento


class TratamientoService:

    @staticmethod
    def create_tratamiento(validated_data):
        try:
            return Tratamiento.objects.create(**validated_data)
        except IntegrityError:
            raise ValueError("Ya existe un tratamiento con ese nombre.")

    @staticmethod
    def update_tratamiento(instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except IntegrityError:
            raise ValueError("Ya existe un tratamiento con ese nombre.")

    @staticmethod
    def delete_tratamiento(instance):
        try:
            instance.delete()
        except (IntegrityError, RestrictedError):
            raise ValueError(
                "No se puede eliminar este tratamiento porque tiene registros de seguimiento asociados."
            )


class SeguimientoService:

    @staticmethod
    def create_seguimiento(validated_data):
        tratamiento = validated_data.get('id_tratamiento')
        if tratamiento.estado != 'activo':
            raise ValueError("El tratamiento seleccionado no está disponible.")

        medicamento = validated_data.get('id_medicamento')
        if medicamento is not None:
            if medicamento.estado != 'activo':
                raise ValueError(
                    "El medicamento seleccionado no está disponible (inactivo)."
                )
            if medicamento.cantidad <= 0:
                raise ValueError(
                    "El medicamento seleccionado no tiene stock disponible."
                )

        with transaction.atomic():
            seguimiento = Seguimiento.objects.create(**validated_data)

            if medicamento is not None:
                medicamento.cantidad -= 1
                if medicamento.cantidad == 0:
                    medicamento.estado = 'inactivo'
                medicamento.save()

            return seguimiento
