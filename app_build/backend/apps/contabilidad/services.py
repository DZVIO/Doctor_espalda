from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Pago

class PagoService:
    @staticmethod
    def crear_pago_automatico(sesion):
        pago = Pago.objects.create(
            id_sesion=sesion,
            estado_pago='pendiente',
            monto_pagado=Decimal('0.00'),
            saldo_pendiente=sesion.total,
            metodo_pago=None,
            fecha_pago=None
        )
        return pago

    @staticmethod
    def confirmar_pago(id_pago, metodo_pago, monto_pagado, observaciones=None):
        monto_pagado_dec = Decimal(str(monto_pagado))
        if monto_pagado_dec <= Decimal('0.00'):
            raise ValueError("El monto pagado debe ser mayor a 0.")
        
        with transaction.atomic():
            pago = Pago.objects.select_for_update().get(id=id_pago)
            sesion = pago.id_sesion
            
            nuevo_total_pagado = pago.monto_pagado + monto_pagado_dec
            
            if nuevo_total_pagado > sesion.total:
                raise ValueError(
                    f"El monto pagado acumulado ({nuevo_total_pagado}) no puede superar el total de la sesión ({sesion.total})."
                )
            
            pago.monto_pagado = nuevo_total_pagado
            pago.saldo_pendiente = max(Decimal('0.00'), sesion.total - nuevo_total_pagado)
            
            if pago.saldo_pendiente == Decimal('0.00'):
                pago.estado_pago = 'pagado'
            else:
                pago.estado_pago = 'parcial'
            
            pago.metodo_pago = metodo_pago
            pago.fecha_pago = timezone.now()
            
            if observaciones is not None:
                pago.observaciones = observaciones
                
            pago.save()
            return pago

    @staticmethod
    def marcar_pagado_completo(id_pago, metodo_pago):
        with transaction.atomic():
            pago = Pago.objects.select_for_update().get(id=id_pago)
            sesion = pago.id_sesion
            
            pago.monto_pagado = sesion.total
            pago.saldo_pendiente = Decimal('0.00')
            pago.estado_pago = 'pagado'
            pago.metodo_pago = metodo_pago
            pago.fecha_pago = timezone.now()
            
            pago.save()
            return pago

    @staticmethod
    def actualizar_saldo_por_sesion(sesion):
        try:
            # We fetch with select_for_update inside an atomic transaction (if there is one active)
            pago = Pago.objects.select_for_update().get(id_sesion=sesion)
        except Pago.DoesNotExist:
            return None
            
        nuevo_saldo = sesion.total - pago.monto_pagado
        pago.saldo_pendiente = max(Decimal('0.00'), nuevo_saldo)
        
        if pago.saldo_pendiente <= Decimal('0.00'):
            if pago.estado_pago == 'parcial':
                pago.estado_pago = 'pagado'
                if not pago.fecha_pago:
                    pago.fecha_pago = timezone.now()
        else:
            if pago.estado_pago == 'pagado':
                pago.estado_pago = 'parcial'
            elif pago.estado_pago == 'pendiente' and pago.monto_pagado > Decimal('0.00'):
                pago.estado_pago = 'parcial'
                
        pago.save()
        return pago
