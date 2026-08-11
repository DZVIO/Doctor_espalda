from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from .models import Medicamento, FormaFarmaceutica, UnidadMedida, Presentacion
from apps.treatments.models import Tratamiento, Sesion
from apps.patients.models import Paciente


class MedicamentoModelTest(TestCase):

    def setUp(self):
        self.forma = FormaFarmaceutica.objects.create(forma='Tableta')
        self.unidad = UnidadMedida.objects.create(unidad='Miligramo', abreviatura='mg', tipo='masa')
        self.presentacion = Presentacion.objects.create(
            forma_farmaceutica=self.forma,
            concentracion=100,
            unidad_medida=self.unidad
        )

    def test_create_medicamento_success(self):
        med = Medicamento.objects.create(
            nombre='Ibuprofeno', presentacion=self.presentacion,
            stock=100, precio=Decimal('15.50'),
        )
        self.assertEqual(med.estado, 'activo')
        self.assertEqual(med.stock, 100)

    def test_unique_together_duplicate_fails(self):
        Medicamento.objects.create(
            nombre='Ibuprofeno', presentacion=self.presentacion,
            stock=100, precio=Decimal('15.50'),
        )
        with self.assertRaises(Exception):
            Medicamento.objects.create(
                nombre='Ibuprofeno', presentacion=self.presentacion,
                stock=50, precio=Decimal('10.00'),
            )


class MedicamentoServiceTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=None)
        self.forma = FormaFarmaceutica.objects.create(forma='Jarabe')
        self.unidad = UnidadMedida.objects.create(unidad='Mililitro', abreviatura='ml', tipo='volumen')
        self.presentacion = Presentacion.objects.create(
            forma_farmaceutica=self.forma,
            concentracion=100,
            unidad_medida=self.unidad
        )

    def test_auto_inactivate_on_zero_quantity(self):
        from .services import MedicamentoService
        med = Medicamento.objects.create(
            nombre='Paracetamol', presentacion=self.presentacion,
            stock=5, precio=Decimal('20.00'),
        )
        MedicamentoService.update_medicamento(med, {'stock': 0})
        med.refresh_from_db()
        self.assertEqual(med.estado, 'inactivo')

    def test_delete_sets_null_on_sesion(self):
        from .services import MedicamentoService
        from apps.treatments.models import DetalleSesion
        paciente = Paciente.objects.create(
            nombre='Juan', apellido='Perez', cedula='123456',
        )
        tratamiento = Tratamiento.objects.create(
            nombre='Ajuste cervical', precio=Decimal('80.00'),
        )
        med = Medicamento.objects.create(
            nombre='Gel', presentacion=self.presentacion,
            stock=10, precio=Decimal('25.00'),
        )
        seg = Sesion.objects.create(
            fecha='2025-01-01', hora='10:00:00',
            id_paciente=paciente,
        )
        detalle = DetalleSesion.objects.create(
            id_sesion=seg,
            id_tratamiento=tratamiento,
            id_medicamento=med,
            cantidad=1
        )
        MedicamentoService.delete_medicamento(med)
        detalle.refresh_from_db()
        self.assertIsNone(detalle.id_medicamento)
