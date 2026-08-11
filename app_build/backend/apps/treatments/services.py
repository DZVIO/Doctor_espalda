from django.db import IntegrityError, transaction
from django.db.models import RestrictedError
from .models import Tratamiento, Sesion, DetalleSesion

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
                "No se puede eliminar este tratamiento porque tiene registros de sesión asociados."
            )

class SesionService:
    @staticmethod
    def calcular_precio_total(sesion_id):
        with transaction.atomic():
            sesion = Sesion.objects.select_for_update().get(id=sesion_id)
            detalles = DetalleSesion.objects.filter(id_sesion=sesion)
            
            total = sum(
                (d.id_tratamiento.precio * d.cantidad)
                for d in detalles if d.id_tratamiento
            ) + sum(
                (d.id_medicamento.precio * d.cantidad)
                for d in detalles if d.id_medicamento
            )
            sesion.total = total
            sesion.save(update_fields=['total'])
            
            from apps.contabilidad.services import PagoService
            PagoService.actualizar_saldo_por_sesion(sesion)
            
            return sesion

    @staticmethod
    def create_sesion(validated_data):
        from apps.contabilidad.services import PagoService
        with transaction.atomic():
            sesion = Sesion.objects.create(**validated_data)
            PagoService.crear_pago_automatico(sesion)
            return sesion

    @staticmethod
    def update_sesion(instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    @staticmethod
    def delete_sesion(instance):
        with transaction.atomic():
            detalles = list(instance.detalles.all())
            for detalle in detalles:
                if detalle.id_medicamento:
                    med = detalle.id_medicamento
                    med.stock += detalle.cantidad
                    if med.estado == 'inactivo':
                        med.estado = 'activo'
                    med.save()
            instance.delete()

class DetalleSesionService:
    @staticmethod
    def create_detalle(sesion, validated_data):
        tratamiento = validated_data.get('id_tratamiento')
        medicamento = validated_data.get('id_medicamento')
        cantidad = validated_data.get('cantidad', 1)

        with transaction.atomic():
            if tratamiento:
                if tratamiento.estado != 'activo':
                    raise ValueError("El tratamiento seleccionado no está disponible.")
                    
                # Duplication validation
                exists = DetalleSesion.objects.filter(
                    id_sesion=sesion,
                    id_tratamiento=tratamiento
                ).exists()
                if exists:
                    raise ValueError("Este tratamiento ya fue aplicado en esta sesión.")
                    
                cantidad = 1  # For treatments it's always 1

            if medicamento:
                if medicamento.estado != 'activo':
                    raise ValueError("El medicamento seleccionado no está disponible (inactivo).")
                    
                # Duplication validation
                exists = DetalleSesion.objects.filter(
                    id_sesion=sesion,
                    id_medicamento=medicamento
                ).exists()
                if exists:
                    raise ValueError("Este medicamento ya está registrado en esta sesión. Modifica la cantidad existente.")
                    
                if medicamento.stock < cantidad:
                    raise ValueError(f"Stock insuficiente para {medicamento.nombre}. Disponible: {medicamento.stock}")
                
                medicamento.stock -= cantidad
                if medicamento.stock == 0:
                    medicamento.estado = 'inactivo'
                medicamento.save()

            detalle = DetalleSesion.objects.create(
                id_sesion=sesion,
                id_tratamiento=tratamiento,
                id_medicamento=medicamento,
                cantidad=cantidad
            )
            
            SesionService.calcular_precio_total(sesion.id)
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
                    exists = DetalleSesion.objects.filter(
                        id_sesion=instance.id_sesion,
                        id_tratamiento=tratamiento
                    ).exists()
                    if exists:
                        raise ValueError("Este tratamiento ya fue aplicado en esta sesión.")
                
                instance.id_tratamiento = tratamiento
                instance.cantidad = 1

            if medicamento:
                if medicamento.estado != 'activo' and instance.id_medicamento != medicamento:
                    raise ValueError("El medicamento seleccionado no está disponible (inactivo).")
                
                if instance.id_medicamento != medicamento:
                    exists = DetalleSesion.objects.filter(
                        id_sesion=instance.id_sesion,
                        id_medicamento=medicamento
                    ).exists()
                    if exists:
                        raise ValueError("Este medicamento ya está registrado en esta sesión. Modifica la cantidad existente.")
                
                # If changing the medication or quantity, adjust stock
                if instance.id_medicamento != medicamento or instance.cantidad != cantidad:
                    # Restore previous stock
                    if instance.id_medicamento:
                        old_med = instance.id_medicamento
                        old_med.stock += instance.cantidad
                        if old_med.estado == 'inactivo':
                            old_med.estado = 'activo'
                        old_med.save()
                    
                    # Deduct new stock
                    if medicamento.stock < cantidad:
                        raise ValueError(f"Stock insuficiente para {medicamento.nombre}. Disponible: {medicamento.stock}")
                    
                    medicamento.stock -= cantidad
                    if medicamento.stock == 0:
                        medicamento.estado = 'inactivo'
                    medicamento.save()
                
                instance.id_medicamento = medicamento
                instance.cantidad = cantidad
            
            instance.save()
            SesionService.calcular_precio_total(instance.id_sesion.id)
            return instance

    @staticmethod
    def delete_detalle(instance):
        with transaction.atomic():
            # Validate if it's the last detail
            sesion = instance.id_sesion
            all_detalles = DetalleSesion.objects.filter(id_sesion=sesion)
            
            if all_detalles.count() == 1:
                raise ValueError("No se puede eliminar el único detalle de la sesión. Una sesión no puede quedar vacía.")
                
            if instance.id_medicamento:
                med = instance.id_medicamento
                med.stock += instance.cantidad
                if med.estado == 'inactivo':
                    med.estado = 'activo'
                med.save()
            
            sesion_id = instance.id_sesion.id
            instance.delete()
            
            SesionService.calcular_precio_total(sesion_id)
