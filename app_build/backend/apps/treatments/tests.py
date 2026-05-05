from django.test import TestCase
from decimal import Decimal

from .models import Tratamiento, Seguimiento
from .services import TratamientoService, SeguimientoService
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
        Seguimiento.objects.create(
            fecha='2025-06-01', hora='09:00:00',
            precio=Decimal('50.00'),
            id_paciente=paciente,
            id_tratamiento=t,
        )
        with self.assertRaises(ValueError):
            TratamientoService.delete_tratamiento(t)


class SeguimientoServiceTest(TestCase):

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

    def test_create_success_with_stock_decrement(self):
        seg = SeguimientoService.create_seguimiento({
            'fecha': '2025-07-01',
            'hora': '10:00:00',
            'precio': Decimal('60.00'),
            'id_paciente': self.paciente,
            'id_tratamiento': self.tratamiento,
            'id_medicamento': self.medicamento,
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 1)
        self.assertIsNotNone(seg.id)

    def test_create_with_inactive_tratamiento_fails(self):
        self.tratamiento.estado = 'inactivo'
        self.tratamiento.save()
        with self.assertRaises(ValueError) as ctx:
            SeguimientoService.create_seguimiento({
                'fecha': '2025-07-01',
                'hora': '10:00:00',
                'precio': Decimal('60.00'),
                'id_paciente': self.paciente,
                'id_tratamiento': self.tratamiento,
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_create_with_zero_stock_medicamento_fails(self):
        self.medicamento.cantidad = 0
        self.medicamento.estado = 'inactivo'
        self.medicamento.save()
        with self.assertRaises(ValueError) as ctx:
            SeguimientoService.create_seguimiento({
                'fecha': '2025-07-01',
                'hora': '10:00:00',
                'precio': Decimal('60.00'),
                'id_paciente': self.paciente,
                'id_tratamiento': self.tratamiento,
                'id_medicamento': self.medicamento,
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_stock_becomes_zero_auto_inactivates(self):
        self.medicamento.cantidad = 1
        self.medicamento.save()
        SeguimientoService.create_seguimiento({
            'fecha': '2025-07-01',
            'hora': '11:00:00',
            'precio': Decimal('60.00'),
            'id_paciente': self.paciente,
            'id_tratamiento': self.tratamiento,
            'id_medicamento': self.medicamento,
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.cantidad, 0)
        self.assertEqual(self.medicamento.estado, 'inactivo')
