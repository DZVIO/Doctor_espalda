from django.test import TestCase
from decimal import Decimal

from .models import Tratamiento, Seguimiento, DetalleSeguimiento
from .services import TratamientoService, SeguimientoService, DetalleSeguimientoService
from apps.patients.models import Paciente
from apps.inventory.models import Medicamento

class TratamientoServiceTest(TestCase):

    def test_create_success(self):
        t = TratamientoService.create_tratamiento({
            'nombre': 'Ajuste lumbar',
            'precio': Decimal('100.00'),
        })
        self.assertEqual(t.nombre, 'Ajuste lumbar')
        self.assertEqual(t.estado, 'activo')

    def test_create_duplicate_name_fails(self):
        TratamientoService.create_tratamiento({
            'nombre': 'Ajuste cervical',
            'precio': Decimal('80.00'),
        })
        with self.assertRaises(ValueError):
            TratamientoService.create_tratamiento({
                'nombre': 'Ajuste cervical',
                'precio': Decimal('90.00'),
            })

    def test_delete_with_seguimiento_fails(self):
        paciente = Paciente.objects.create(
            nombre='Ana', apellido='Lopez', cedula='999888',
        )
        t = Tratamiento.objects.create(
            nombre='Terapia', precio=Decimal('50.00'),
        )
        seg = Seguimiento.objects.create(
            fecha='2025-06-01', hora='09:00:00',
            id_paciente=paciente,
        )
        DetalleSeguimiento.objects.create(
            id_venta=seg,
            id_tratamiento=t,
            cantidad=1
        )
        with self.assertRaises(ValueError):
            TratamientoService.delete_tratamiento(t)

class DetalleSeguimientoServiceTest(TestCase):

    def setUp(self):
        self.paciente = Paciente.objects.create(
            nombre='Carlos', apellido='Ruiz', cedula='111222',
        )
        self.tratamiento = Tratamiento.objects.create(
            nombre='Masaje', precio=Decimal('60.00'), estado='activo',
        )
        self.medicamento = Medicamento.objects.create(
            nombre='Crema', presentacion='Tubo', unidad_medida='g',
            cantidad=2, precio=Decimal('30.00'),
        )
        self.seguimiento = Seguimiento.objects.create(
            fecha='2025-07-01', hora='10:00:00', id_paciente=self.paciente
        )

    def test_create_tratamiento_detalle(self):
        DetalleSeguimientoService.create_detalle(self.seguimiento, {
            'id_tratamiento': self.tratamiento,
        })
        self.seguimiento.refresh_from_db()
        self.assertEqual(self.seguimiento.total, Decimal('60.00'))

    def test_create_medicamento_detalle_stock_decrement(self):
        DetalleSeguimientoService.create_detalle(self.seguimiento, {
            'id_medicamento': self.medicamento,
            'cantidad': 1
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 1)
        self.seguimiento.refresh_from_db()
        self.assertEqual(self.seguimiento.total, Decimal('30.00'))

    def test_create_with_inactive_tratamiento_fails(self):
        self.tratamiento.estado = 'inactivo'
        self.tratamiento.save()
        with self.assertRaises(ValueError) as ctx:
            DetalleSeguimientoService.create_detalle(self.seguimiento, {
                'id_tratamiento': self.tratamiento,
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_create_with_zero_stock_medicamento_fails(self):
        self.medicamento.cantidad = 0
        self.medicamento.estado = 'inactivo'
        self.medicamento.save()
        with self.assertRaises(ValueError) as ctx:
            DetalleSeguimientoService.create_detalle(self.seguimiento, {
                'id_medicamento': self.medicamento,
                'cantidad': 1
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_create_with_insufficient_stock_fails(self):
        with self.assertRaises(ValueError) as ctx:
            DetalleSeguimientoService.create_detalle(self.seguimiento, {
                'id_medicamento': self.medicamento,
                'cantidad': 3
            })
        self.assertIn('Stock insuficiente', str(ctx.exception))

    def test_stock_becomes_zero_auto_inactivates(self):
        DetalleSeguimientoService.create_detalle(self.seguimiento, {
            'id_medicamento': self.medicamento,
            'cantidad': 2
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 0)
        self.assertEqual(self.medicamento.estado, 'inactivo')

    def test_delete_detalle_reverts_stock(self):
        detalle = DetalleSeguimientoService.create_detalle(self.seguimiento, {
            'id_medicamento': self.medicamento,
            'cantidad': 2
        })
        DetalleSeguimientoService.create_detalle(self.seguimiento, {
            'id_tratamiento': self.tratamiento
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 0)

        DetalleSeguimientoService.delete_detalle(detalle)
        
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 2)
        self.assertEqual(self.medicamento.estado, 'activo')
        
        self.seguimiento.refresh_from_db()
        self.assertEqual(self.seguimiento.total, Decimal('60.00'))
