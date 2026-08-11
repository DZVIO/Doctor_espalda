from django.contrib import admin
from .models import Tratamiento, Sesion, DetalleSesion

class DetalleSesionInline(admin.TabularInline):
    model = DetalleSesion
    extra = 1

class SesionAdmin(admin.ModelAdmin):
    inlines = [DetalleSesionInline]

admin.site.register(Tratamiento)
admin.site.register(Sesion, SesionAdmin)
admin.site.register(DetalleSesion)
