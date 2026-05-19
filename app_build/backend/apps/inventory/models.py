from django.db import models

class FormaFarmaceutica(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    forma = models.CharField(max_length=255, unique=True, null=False)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'formas_farmaceuticas'

    def __str__(self):
        return self.forma


class UnidadMedida(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]
    TIPO_CHOICES = [
        ('masa', 'Masa'),
        ('volumen', 'Volumen'),
        ('unidad', 'Unidad'),
        ('otro', 'Otro'),
    ]

    id = models.BigAutoField(primary_key=True)
    unidad = models.CharField(max_length=255, unique=True, null=False)
    abreviatura = models.CharField(max_length=50, null=False)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'unidades_medida'

    def __str__(self):
        return f"{self.unidad} ({self.abreviatura})"


class Marca(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    marca = models.CharField(max_length=255, unique=True, null=False)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marcas'

    def __str__(self):
        return self.marca


class Presentacion(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    forma_farmaceutica = models.ForeignKey(FormaFarmaceutica, on_delete=models.RESTRICT)
    concentracion = models.DecimalField(max_digits=10, decimal_places=2)
    unidad_medida = models.ForeignKey(UnidadMedida, on_delete=models.RESTRICT)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'presentaciones'

    def __str__(self):
        return f"{self.forma_farmaceutica.forma} - {self.concentracion} {self.unidad_medida.abreviatura}".strip()

class Categoria(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    categoria = models.CharField(max_length=255, unique=True, null=False)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categorias'

    def __str__(self):
        return self.categoria


class Medicamento(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True, null=False)
    descripcion = models.TextField(null=True, blank=True)
    marca = models.ForeignKey(Marca, on_delete=models.RESTRICT, null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.RESTRICT, null=True, blank=True)
    presentacion = models.ForeignKey(Presentacion, on_delete=models.RESTRICT, null=True, blank=True)
    stock = models.IntegerField(default=0)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medicamentos'

    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock}"
