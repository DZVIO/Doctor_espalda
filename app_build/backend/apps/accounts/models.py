from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class AdministradorManager(BaseUserManager):
    def create_user(self, numero_documento, password=None, **extra_fields):
        if not numero_documento:
            raise ValueError('El número de documento es obligatorio')
        user = self.model(numero_documento=numero_documento, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, numero_documento, password=None, **extra_fields):
        return self.create_user(numero_documento, password, **extra_fields)

class Administrador(AbstractBaseUser):
    TIPO_DOCUMENTO_CHOICES = [
        ('CC', 'CC'),
        ('CE', 'CE'),
        ('NIT', 'NIT'),
        ('PP', 'PP'),
    ]

    usuario = models.CharField(max_length=255)
    tipo_documento = models.CharField(max_length=3, choices=TIPO_DOCUMENTO_CHOICES)
    numero_documento = models.CharField(max_length=255, unique=True)
    telefono = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AdministradorManager()

    USERNAME_FIELD = 'numero_documento'
    REQUIRED_FIELDS = ['usuario', 'tipo_documento']

    class Meta:
        db_table = 'administrador'

    def __str__(self):
        return f"{self.usuario} - {self.numero_documento}"
