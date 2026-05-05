from django.db import models

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

class Seguimiento(models.Model):
    fecha = models.DateField()
    hora = models.TimeField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    id_paciente = models.ForeignKey('patients.Paciente', on_delete=models.RESTRICT, db_column='id_paciente')
    id_tratamiento = models.ForeignKey(Tratamiento, on_delete=models.RESTRICT, db_column='id_tratamiento')
    id_medicamento = models.ForeignKey('inventory.Medicamento', on_delete=models.SET_NULL, null=True, blank=True, db_column='id_medicamento')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seguimiento'

    def __str__(self):
        return f"Seguimiento: {self.id_paciente} el {self.fecha}"
