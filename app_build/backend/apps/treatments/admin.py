from django.contrib import admin
from .models import Tratamiento, Seguimiento, DetalleSeguimiento

class DetalleSeguimientoInline(admin.TabularInline):
    model = DetalleSeguimiento
    extra = 1

class SeguimientoAdmin(admin.ModelAdmin):
    inlines = [DetalleSeguimientoInline]

admin.site.register(Tratamiento)
admin.site.register(Seguimiento, SeguimientoAdmin)
admin.site.register(DetalleSeguimiento)
