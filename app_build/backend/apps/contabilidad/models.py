from django.db import models
from apps.treatments.models import Sesion

class Pago(models.Model):
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('otro', 'Otro'),
    ]

    ESTADO_PAGO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('parcial', 'Parcial'),
    ]

    id = models.BigAutoField(primary_key=True)
    id_sesion = models.OneToOneField(
        Sesion,
        on_delete=models.CASCADE,
        related_name='pago',
        db_column='id_sesion'
    )
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_PAGO_CHOICES,
        null=True,
        blank=True
    )
    estado_pago = models.CharField(
        max_length=20,
        choices=ESTADO_PAGO_CHOICES,
        default='pendiente'
    )
    monto_pagado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    saldo_pendiente = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    fecha_pago = models.DateTimeField(
        null=True,
        blank=True
    )
    observaciones = models.TextField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pagos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pago {self.id} - Sesión {self.id_sesion_id} ({self.estado_pago})"
