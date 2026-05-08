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
                    
                # Duplication validation
                exists = DetalleSeguimiento.objects.filter(
                    id_venta=seguimiento,
                    id_tratamiento=tratamiento
                ).exists()
                if exists:
                    raise ValueError("Este tratamiento ya fue aplicado en este seguimiento.")
                    
                cantidad = 1  # For treatments it's always 1

            if medicamento:
                if medicamento.estado != 'activo':
                    raise ValueError("El medicamento seleccionado no está disponible (inactivo).")
                    
                # Duplication validation
                exists = DetalleSeguimiento.objects.filter(
                    id_venta=seguimiento,
                    id_medicamento=medicamento
                ).exists()
                if exists:
                    raise ValueError("Este medicamento ya está registrado en este seguimiento. Modifica la cantidad existente.")
                    
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
    def update_detalle(instance, validated_data):
        tratamiento = validated_data.get('id_tratamiento')
        medicamento = validated_data.get('id_medicamento')
        cantidad = validated_data.get('cantidad', instance.cantidad)
        
        with transaction.atomic():
            if tratamiento:
                if tratamiento.estado != 'activo':
                    raise ValueError("El tratamiento seleccionado no está disponible.")
                
                if instance.id_tratamiento != tratamiento:
                    exists = DetalleSeguimiento.objects.filter(
                        id_venta=instance.id_venta,
                        id_tratamiento=tratamiento
                    ).exists()
                    if exists:
                        raise ValueError("Este tratamiento ya fue aplicado en este seguimiento.")
                
                instance.id_tratamiento = tratamiento
                instance.cantidad = 1

            if medicamento:
                if medicamento.estado != 'activo' and instance.id_medicamento != medicamento:
                    raise ValueError("El medicamento seleccionado no está disponible (inactivo).")
                
                if instance.id_medicamento != medicamento:
                    exists = DetalleSeguimiento.objects.filter(
                        id_venta=instance.id_venta,
                        id_medicamento=medicamento
                    ).exists()
                    if exists:
                        raise ValueError("Este medicamento ya está registrado en este seguimiento. Modifica la cantidad existente.")
                
                # If changing the medication or quantity, adjust stock
                if instance.id_medicamento != medicamento or instance.cantidad != cantidad:
                    # Restore previous stock
                    if instance.id_medicamento:
                        old_med = instance.id_medicamento
                        old_med.cantidad += instance.cantidad
                        if old_med.estado == 'inactivo':
                            old_med.estado = 'activo'
                        old_med.save()
                    
                    # Deduct new stock
                    if medicamento.cantidad < cantidad:
                        raise ValueError("Stock insuficiente para el medicamento seleccionado.")
                    
                    medicamento.cantidad -= cantidad
                    if medicamento.cantidad == 0:
                        medicamento.estado = 'inactivo'
                    medicamento.save()
                
                instance.id_medicamento = medicamento
                instance.cantidad = cantidad
            
            instance.save()
            SeguimientoService.calcular_precio_total(instance.id_venta.id)
            return instance

    @staticmethod
    def delete_detalle(instance):
        with transaction.atomic():
            # Validate if it's the last detail
            seguimiento = instance.id_venta
            all_detalles = DetalleSeguimiento.objects.filter(id_venta=seguimiento)
            
            if all_detalles.count() == 1:
                raise ValueError("No se puede eliminar el único detalle del seguimiento. Un seguimiento no puede quedar vacío.")
                
            if instance.id_medicamento:
                med = instance.id_medicamento
                med.cantidad += instance.cantidad
                if med.estado == 'inactivo':
                    med.estado = 'activo'
                med.save()
            
            seguimiento_id = instance.id_venta.id
            instance.delete()
            
            SeguimientoService.calcular_precio_total(seguimiento_id)
