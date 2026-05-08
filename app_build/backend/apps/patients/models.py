from django.db import models

class Paciente(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=255)
    apellido = models.CharField(max_length=255)
    cedula = models.CharField(max_length=255, unique=True)
    correo = models.CharField(max_length=255, null=True, blank=True)
    numero = models.CharField(max_length=255, null=True, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    region = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pacientes'

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.cedula}"
