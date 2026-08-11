from django.test import TestCase
from decimal import Decimal
from django.utils import timezone
from apps.patients.models import Paciente
from apps.treatments.models import Sesion, Tratamiento, DetalleSesion
from apps.treatments.services import SesionService, DetalleSesionService
from .models import Pago
from .services import PagoService

class ContabilidadTestCase(TestCase):
    def setUp(self):
        self.paciente = Paciente.objects.create(
            nombre="Juan",
            apellido="Perez",
            cedula="123456"
        )
        self.tratamiento = Tratamiento.objects.create(
            nombre="Ajuste cervical",
            precio=Decimal("150.00"),
            estado="activo"
        )
        
    def test_creacion_pago_automatico(self):
        # Create Sesion and verify associated Pago is created automatically
        sesion = SesionService.create_sesion({
            'fecha': '2026-06-12',
            'hora': '10:00:00',
            'id_paciente': self.paciente
        })
        
        self.assertTrue(hasattr(sesion, 'pago'))
        pago = sesion.pago
        self.assertEqual(pago.estado_pago, 'pendiente')
        self.assertEqual(pago.monto_pagado, Decimal('0.00'))
        self.assertEqual(pago.saldo_pendiente, Decimal('0.00'))  # because total is 0 initially
        self.assertIsNone(pago.metodo_pago)
        self.assertIsNone(pago.fecha_pago)
        
    def test_confirmar_pago_flujo(self):
        # Create a sesion with details (so total is > 0)
        sesion = SesionService.create_sesion({
            'fecha': '2026-06-12',
            'hora': '10:00:00',
            'id_paciente': self.paciente
        })
        
        # Add a treatment detail to make total = 150.00
        DetalleSesionService.create_detalle(sesion, {
            'id_tratamiento': self.tratamiento,
            'cantidad': 1
        })
        
        # Verify payment is updated to total
        pago = Pago.objects.get(id_sesion=sesion)
        self.assertEqual(pago.saldo_pendiente, Decimal('150.00'))
        
        # Confirm partial payment of 50.00 (abono)
        PagoService.confirmar_pago(
            id_pago=pago.id,
            metodo_pago='efectivo',
            monto_pagado=Decimal('50.00'),
            observaciones='Pago primera cuota'
        )
        
        pago.refresh_from_db()
        self.assertEqual(pago.estado_pago, 'parcial')
        self.assertEqual(pago.monto_pagado, Decimal('50.00'))
        self.assertEqual(pago.saldo_pendiente, Decimal('100.00'))
        self.assertEqual(pago.metodo_pago, 'efectivo')
        self.assertIsNotNone(pago.fecha_pago)
        self.assertEqual(pago.observaciones, 'Pago primera cuota')
        
        # Confirm another abono of 100.00 (completes the payment)
        PagoService.confirmar_pago(
            id_pago=pago.id,
            metodo_pago='tarjeta',
            monto_pagado=Decimal('100.00')
        )
        
        pago.refresh_from_db()
        self.assertEqual(pago.estado_pago, 'pagado')
        self.assertEqual(pago.monto_pagado, Decimal('150.00'))
        self.assertEqual(pago.saldo_pendiente, Decimal('0.00'))
        self.assertEqual(pago.metodo_pago, 'tarjeta')
        
        # Confirming further payment exceeds total and must fail
        with self.assertRaises(ValueError):
            PagoService.confirmar_pago(
                id_pago=pago.id,
                metodo_pago='tarjeta',
                monto_pagado=Decimal('10.00')
            )
            
    def test_marcar_pagado_completo(self):
        sesion = SesionService.create_sesion({
            'fecha': '2026-06-12',
            'hora': '10:00:00',
            'id_paciente': self.paciente
        })
        DetalleSesionService.create_detalle(sesion, {
            'id_tratamiento': self.tratamiento,
            'cantidad': 1
        })
        
        pago = Pago.objects.get(id_sesion=sesion)
        
        PagoService.marcar_pagado_completo(pago.id, 'transferencia')
        
        pago.refresh_from_db()
        self.assertEqual(pago.estado_pago, 'pagado')
        self.assertEqual(pago.monto_pagado, Decimal('150.00'))
        self.assertEqual(pago.saldo_pendiente, Decimal('0.00'))
        self.assertEqual(pago.metodo_pago, 'transferencia')
        self.assertIsNotNone(pago.fecha_pago)

    def test_cambio_total_sesion_actualiza_saldo(self):
        sesion = SesionService.create_sesion({
            'fecha': '2026-06-12',
            'hora': '10:00:00',
            'id_paciente': self.paciente
        })
        detalle = DetalleSesionService.create_detalle(sesion, {
            'id_tratamiento': self.tratamiento,
            'cantidad': 1
        })
        
        pago = Pago.objects.get(id_sesion=sesion)
        self.assertEqual(pago.saldo_pendiente, Decimal('150.00'))
        
        # Make a partial payment of 50.00
        PagoService.confirmar_pago(
            id_pago=pago.id,
            metodo_pago='efectivo',
            monto_pagado=Decimal('50.00')
        )
        
        pago.refresh_from_db()
        self.assertEqual(pago.saldo_pendiente, Decimal('100.00'))
        
        # Add another detail, increasing total by 200.00 (new total = 350.00)
        t2 = Tratamiento.objects.create(
            nombre="Ajuste lumbar",
            precio=Decimal("200.00"),
            estado="activo"
        )
        DetalleSesionService.create_detalle(sesion, {
            'id_tratamiento': t2,
            'cantidad': 1
        })
        
        pago.refresh_from_db()
        self.assertEqual(pago.saldo_pendiente, Decimal('300.00'))
        self.assertEqual(pago.estado_pago, 'parcial')
        
        # Delete first detail (150.00), reducing total to 200.00. Balance = 200.00 - 50.00 = 150.00
        DetalleSesionService.delete_detalle(detalle)
        pago.refresh_from_db()
        self.assertEqual(pago.saldo_pendiente, Decimal('150.00'))
