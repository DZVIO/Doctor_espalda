from django.db import models

class Medicamento(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    presentacion = models.CharField(max_length=255, null=True, blank=True)
    unidad_medida = models.CharField(max_length=255, null=True, blank=True)
    cantidad = models.IntegerField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medicamentos'
        unique_together = [['nombre', 'presentacion', 'unidad_medida']]

    def __str__(self):
        return f"{self.nombre} ({self.presentacion}) - Qty: {self.cantidad}"
