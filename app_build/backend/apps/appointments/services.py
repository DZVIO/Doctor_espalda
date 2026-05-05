from django.core.exceptions import ValidationError
from .models import Agendamiento


class AgendamientoService:

    @staticmethod
    def validate_horario(hora_ingreso, hora_salida):
        if hora_salida <= hora_ingreso:
            raise ValueError("La hora de salida debe ser mayor a la hora de ingreso.")

    @staticmethod
    def validate_no_duplicate(fecha, hora_ingreso, id_paciente, exclude_id=None):
        qs = Agendamiento.objects.filter(
            fecha=fecha,
            hora_ingreso=hora_ingreso,
            id_paciente=id_paciente,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        if qs.exists():
            raise ValueError("Ya existe una cita para este paciente en esa fecha y hora de ingreso.")

    @staticmethod
    def validate_no_overlap(fecha, hora_ingreso, hora_salida, exclude_id=None):
        qs = Agendamiento.objects.filter(
            fecha=fecha,
            hora_ingreso__lt=hora_salida,
            hora_salida__gt=hora_ingreso,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        if qs.exists():
            raise ValueError("El horario se solapa con una cita existente en esa fecha.")

    @staticmethod
    def create_agendamiento(validated_data):
        fecha = validated_data['fecha']
        hora_ingreso = validated_data['hora_ingreso']
        hora_salida = validated_data['hora_salida']
        id_paciente = validated_data['id_paciente']

        AgendamientoService.validate_horario(hora_ingreso, hora_salida)
        AgendamientoService.validate_no_duplicate(fecha, hora_ingreso, id_paciente)
        AgendamientoService.validate_no_overlap(fecha, hora_ingreso, hora_salida)

        return Agendamiento.objects.create(**validated_data)

    @staticmethod
    def update_agendamiento(instance, validated_data):
        fecha = validated_data.get('fecha', instance.fecha)
        hora_ingreso = validated_data.get('hora_ingreso', instance.hora_ingreso)
        hora_salida = validated_data.get('hora_salida', instance.hora_salida)
        id_paciente = validated_data.get('id_paciente', instance.id_paciente)

        AgendamientoService.validate_horario(hora_ingreso, hora_salida)
        AgendamientoService.validate_no_duplicate(fecha, hora_ingreso, id_paciente, exclude_id=instance.pk)
        AgendamientoService.validate_no_overlap(fecha, hora_ingreso, hora_salida, exclude_id=instance.pk)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    @staticmethod
    def delete_agendamiento(instance):
        instance.delete()
