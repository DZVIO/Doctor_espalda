from django.test import TestCase
from decimal import Decimal

from .models import Tratamiento, Sesion, DetalleSesion
from .services import TratamientoService, SesionService, DetalleSesionService
from apps.patients.models import Paciente
from apps.inventory.models import Medicamento, FormaFarmaceutica, UnidadMedida, Presentacion

class TratamientoServiceTest(TestCase):
    # ... test_create_success, etc. ...
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

    def test_delete_with_sesion_fails(self):
        paciente = Paciente.objects.create(
            nombre='Ana', apellido='Lopez', cedula='999888',
        )
        t = Tratamiento.objects.create(
            nombre='Terapia', precio=Decimal('50.00'),
        )
        seg = Sesion.objects.create(
            fecha='2025-06-01', hora='09:00:00',
            id_paciente=paciente,
        )
        DetalleSesion.objects.create(
            id_sesion=seg,
            id_tratamiento=t,
            cantidad=1
        )
        with self.assertRaises(ValueError):
            TratamientoService.delete_tratamiento(t)

class DetalleSesionServiceTest(TestCase):

    def setUp(self):
        self.paciente = Paciente.objects.create(
            nombre='Carlos', apellido='Ruiz', cedula='111222',
        )
        self.tratamiento = Tratamiento.objects.create(
            nombre='Masaje', precio=Decimal('60.00'), estado='activo',
        )
        self.forma = FormaFarmaceutica.objects.create(forma='Crema')
        self.unidad = UnidadMedida.objects.create(unidad='Gramo', abreviatura='g', tipo='masa')
        self.presentacion = Presentacion.objects.create(
            forma_farmaceutica=self.forma,
            concentracion=100,
            unidad_medida=self.unidad
        )
        self.medicamento = Medicamento.objects.create(
            nombre='Crema', presentacion=self.presentacion,
            stock=2, precio=Decimal('30.00'),
        )
        self.sesion = Sesion.objects.create(
            fecha='2025-07-01', hora='10:00:00', id_paciente=self.paciente
        )

    def test_create_tratamiento_detalle(self):
        DetalleSesionService.create_detalle(self.sesion, {
            'id_tratamiento': self.tratamiento,
        })
        self.sesion.refresh_from_db()
        self.assertEqual(self.sesion.total, Decimal('60.00'))

    def test_create_medicamento_detalle_stock_decrement(self):
        DetalleSesionService.create_detalle(self.sesion, {
            'id_medicamento': self.medicamento,
            'cantidad': 1
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.stock, 1)
        self.sesion.refresh_from_db()
        self.assertEqual(self.sesion.total, Decimal('30.00'))

    def test_create_with_inactive_tratamiento_fails(self):
        self.tratamiento.estado = 'inactivo'
        self.tratamiento.save()
        with self.assertRaises(ValueError) as ctx:
            DetalleSesionService.create_detalle(self.sesion, {
                'id_tratamiento': self.tratamiento,
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_create_with_zero_stock_medicamento_fails(self):
        self.medicamento.stock = 0
        self.medicamento.estado = 'inactivo'
        self.medicamento.save()
        with self.assertRaises(ValueError) as ctx:
            DetalleSesionService.create_detalle(self.sesion, {
                'id_medicamento': self.medicamento,
                'cantidad': 1
            })
        self.assertIn('no está disponible', str(ctx.exception))

    def test_create_with_insufficient_stock_fails(self):
        with self.assertRaises(ValueError) as ctx:
            DetalleSesionService.create_detalle(self.sesion, {
                'id_medicamento': self.medicamento,
                'cantidad': 3
            })
        self.assertIn('Stock insuficiente', str(ctx.exception))

    def test_stock_becomes_zero_auto_inactivates(self):
        DetalleSesionService.create_detalle(self.sesion, {
            'id_medicamento': self.medicamento,
            'cantidad': 2
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.stock, 0)
        self.assertEqual(self.medicamento.estado, 'inactivo')

    def test_delete_detalle_reverts_stock(self):
        detalle = DetalleSesionService.create_detalle(self.sesion, {
            'id_medicamento': self.medicamento,
            'cantidad': 2
        })
        DetalleSesionService.create_detalle(self.sesion, {
            'id_tratamiento': self.tratamiento
        })
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.stock, 0)

        DetalleSesionService.delete_detalle(detalle)
        
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.stock, 2)
        self.assertEqual(self.medicamento.estado, 'activo')
        
        self.sesion.refresh_from_db()
        self.assertEqual(self.sesion.total, Decimal('60.00'))
