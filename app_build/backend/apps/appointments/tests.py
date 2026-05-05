from django.test import TestCase
from datetime import date, time

from .services import AgendamientoService
from apps.patients.models import Paciente


class AgendamientoServiceTest(TestCase):

    def setUp(self):
        self.paciente = Paciente.objects.create(
            nombre='Diego', apellido='Mendez', cedula='987654',
        )

    def test_create_success(self):
        cita = AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 1),
            'hora_ingreso': time(9, 0),
            'hora_salida': time(10, 0),
            'id_paciente': self.paciente,
        })
        self.assertIsNotNone(cita.id)

    def test_hora_salida_must_be_greater(self):
        with self.assertRaises(ValueError) as ctx:
            AgendamientoService.create_agendamiento({
                'fecha': date(2025, 9, 1),
                'hora_ingreso': time(10, 0),
                'hora_salida': time(9, 0),
                'id_paciente': self.paciente,
            })
        self.assertIn('hora de salida', str(ctx.exception))

    def test_duplicate_same_fecha_hora_paciente(self):
        AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 2),
            'hora_ingreso': time(8, 0),
            'hora_salida': time(9, 0),
            'id_paciente': self.paciente,
        })
        with self.assertRaises(ValueError) as ctx:
            AgendamientoService.create_agendamiento({
                'fecha': date(2025, 9, 2),
                'hora_ingreso': time(8, 0),
                'hora_salida': time(9, 30),
                'id_paciente': self.paciente,
            })
        self.assertIn('Ya existe', str(ctx.exception))

    def test_overlap_detection(self):
        AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 3),
            'hora_ingreso': time(10, 0),
            'hora_salida': time(11, 0),
            'id_paciente': self.paciente,
        })
        otro_paciente = Paciente.objects.create(
            nombre='Ana', apellido='Ruiz', cedula='111333',
        )
        with self.assertRaises(ValueError) as ctx:
            AgendamientoService.create_agendamiento({
                'fecha': date(2025, 9, 3),
                'hora_ingreso': time(10, 30),
                'hora_salida': time(11, 30),
                'id_paciente': otro_paciente,
            })
        self.assertIn('solapa', str(ctx.exception))

    def test_no_overlap_adjacent_slots(self):
        AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 4),
            'hora_ingreso': time(9, 0),
            'hora_salida': time(10, 0),
            'id_paciente': self.paciente,
        })
        otro = Paciente.objects.create(
            nombre='Luis', apellido='Paz', cedula='222444',
        )
        cita2 = AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 4),
            'hora_ingreso': time(10, 0),
            'hora_salida': time(11, 0),
            'id_paciente': otro,
        })
        self.assertIsNotNone(cita2.id)

    def test_delete_success(self):
        cita = AgendamientoService.create_agendamiento({
            'fecha': date(2025, 9, 5),
            'hora_ingreso': time(14, 0),
            'hora_salida': time(15, 0),
            'id_paciente': self.paciente,
        })
        cita_id = cita.id
        AgendamientoService.delete_agendamiento(cita)
        from .models import Agendamiento
        self.assertFalse(Agendamiento.objects.filter(pk=cita_id).exists())
