from django.test import TestCase
from decimal import Decimal

from .models import Paciente
from .services import PacienteService
from apps.appointments.models import Agendamiento
from apps.treatments.models import Tratamiento, Seguimiento


class PacienteServiceTest(TestCase):

    def test_create_success(self):
        p = PacienteService.create_paciente({
            'nombre': 'Maria',
            'apellido': 'Gomez',
            'cedula': '555666',
        })
        self.assertEqual(p.estado, 'activo')

    def test_create_duplicate_cedula_fails(self):
        PacienteService.create_paciente({
            'nombre': 'Pedro',
            'apellido': 'Ramirez',
            'cedula': '777888',
        })
        with self.assertRaises(ValueError):
            PacienteService.create_paciente({
                'nombre': 'Otro',
                'apellido': 'Ramirez',
                'cedula': '777888',
            })

    def test_delete_with_agendamiento_fails(self):
        p = Paciente.objects.create(
            nombre='Luis', apellido='Diaz', cedula='444333',
        )
        Agendamiento.objects.create(
            fecha='2025-08-01',
            hora_ingreso='08:00:00',
            hora_salida='09:00:00',
            id_paciente=p,
        )
        with self.assertRaises(ValueError):
            PacienteService.delete_paciente(p)

    def test_delete_with_seguimiento_fails(self):
        p = Paciente.objects.create(
            nombre='Sofia', apellido='Torres', cedula='111000',
        )
        t = Tratamiento.objects.create(
            nombre='Electroterapia', precio=Decimal('70.00'),
        )
        Seguimiento.objects.create(
            fecha='2025-08-01', hora='10:00:00',
            precio=Decimal('70.00'),
            id_paciente=p,
            id_tratamiento=t,
        )
        with self.assertRaises(ValueError):
            PacienteService.delete_paciente(p)
