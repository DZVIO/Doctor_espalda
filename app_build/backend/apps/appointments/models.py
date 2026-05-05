from django.db import models
from django.core.exceptions import ValidationError

class Agendamiento(models.Model):
    fecha = models.DateField()
    hora_ingreso = models.TimeField()
    hora_salida = models.TimeField()
    
    id_paciente = models.ForeignKey('patients.Paciente', on_delete=models.RESTRICT, db_column='id_paciente')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agendamiento'

    def clean(self):
        super().clean()
        if self.hora_salida and self.hora_ingreso and self.hora_salida <= self.hora_ingreso:
            raise ValidationError("La hora de salida debe ser mayor a la hora de ingreso.")

    def __str__(self):
        return f"Cita: {self.id_paciente} el {self.fecha} ({self.hora_ingreso} - {self.hora_salida})"
