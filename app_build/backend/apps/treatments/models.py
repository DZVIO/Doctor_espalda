from django.db import models
from django.core.exceptions import ValidationError

class Tratamiento(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tratamientos'

    def __str__(self):
        return f"{self.nombre} - ${self.precio}"


class Sesion(models.Model):
    id = models.BigAutoField(primary_key=True)
    fecha = models.DateField()
    hora = models.TimeField()
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    id_paciente = models.ForeignKey('patients.Paciente', on_delete=models.RESTRICT, db_column='id_paciente')
    id_agendamiento = models.ForeignKey('appointments.Agendamiento', on_delete=models.SET_NULL, null=True, blank=True, related_name='sesiones', db_column='id_agendamiento')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sesion'

    def __str__(self):
        return f"Sesión: {self.id_paciente} el {self.fecha}"


class DetalleSesion(models.Model):
    id = models.BigAutoField(primary_key=True)
    cantidad = models.PositiveIntegerField(default=1)
    
    id_medicamento = models.ForeignKey('inventory.Medicamento', on_delete=models.SET_NULL, null=True, blank=True)
    id_tratamiento = models.ForeignKey(Tratamiento, on_delete=models.RESTRICT, null=True, blank=True)
    id_sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='detalles')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'detalle_sesion'

    def __str__(self):
        return f"Detalle de {self.id_sesion}"

    def clean(self):
        if self.id_tratamiento and self.id_medicamento:
            raise ValidationError("Un detalle no puede tener tratamiento y medicamento simultáneamente.")
        if not self.id_tratamiento and not self.id_medicamento:
            raise ValidationError("Un detalle debe tener tratamiento o medicamento.")
