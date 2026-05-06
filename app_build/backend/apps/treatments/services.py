from django.db import IntegrityError, transaction
from django.db.models import RestrictedError
from .models import Tratamiento, Seguimiento, DetalleSeguimiento

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
    def calcular_precio_total(seguimiento_id):
        with transaction.atomic():
            seguimiento = Seguimiento.objects.select_for_update().get(id=seguimiento_id)
            detalles = DetalleSeguimiento.objects.filter(id_venta=seguimiento)
            
            total = sum(
                (d.id_tratamiento.precio * d.cantidad)
                for d in detalles if d.id_tratamiento
            ) + sum(
                (d.id_medicamento.precio * d.cantidad)
                for d in detalles if d.id_medicamento
            )
            seguimiento.total = total
            seguimiento.save(update_fields=['total'])
            return seguimiento

    @staticmethod
    def create_seguimiento(validated_data):
        return Seguimiento.objects.create(**validated_data)

    @staticmethod
    def update_seguimiento(instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    @staticmethod
    def delete_seguimiento(instance):
        with transaction.atomic():
            detalles = list(instance.detalles.all())
            for detalle in detalles:
                if detalle.id_medicamento:
                    med = detalle.id_medicamento
                    med.cantidad += detalle.cantidad
                    if med.estado == 'inactivo':
                        med.estado = 'activo'
                    med.save()
            instance.delete()

class DetalleSeguimientoService:
    @staticmethod
    def create_detalle(seguimiento, validated_data):
        tratamiento = validated_data.get('id_tratamiento')
        medicamento = validated_data.get('id_medicamento')
        cantidad = validated_data.get('cantidad', 1)

        with transaction.atomic():
            if tratamiento:
                if tratamiento.estado != 'activo':
                    raise ValueError("El tratamiento seleccionado no está disponible.")
                cantidad = 1  # For treatments it's always 1

            if medicamento:
                if medicamento.estado != 'activo':
                    raise ValueError("El medicamento seleccionado no está disponible (inactivo).")
                if medicamento.cantidad < cantidad:
                    raise ValueError("Stock insuficiente.")
                
                medicamento.cantidad -= cantidad
                if medicamento.cantidad == 0:
                    medicamento.estado = 'inactivo'
                medicamento.save()

            detalle = DetalleSeguimiento.objects.create(
                id_venta=seguimiento,
                id_tratamiento=tratamiento,
                id_medicamento=medicamento,
                cantidad=cantidad
            )
            
            SeguimientoService.calcular_precio_total(seguimiento.id)
            return detalle

    @staticmethod
    def delete_detalle(instance):
        with transaction.atomic():
            if instance.id_medicamento:
                med = instance.id_medicamento
                med.cantidad += instance.cantidad
                if med.estado == 'inactivo':
                    med.estado = 'activo'
                med.save()
            
            seguimiento_id = instance.id_venta.id
            instance.delete()
            
            SeguimientoService.calcular_precio_total(seguimiento_id)
