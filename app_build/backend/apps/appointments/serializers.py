from rest_framework import serializers
from .models import Agendamiento

class AgendamientoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    seguimientos = serializers.SerializerMethodField()

    class Meta:
        model = Agendamiento
        fields = [
            'id', 'fecha', 'hora_ingreso', 'hora_salida',
            'id_paciente', 'paciente_nombre', 'seguimientos', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_seguimientos(self, obj):
        result = []
        for s in obj.seguimientos.prefetch_related('detalles__id_tratamiento', 'detalles__id_medicamento').all():
            tratamientos = []
            medicamentos = []
            for d in s.detalles.all():
                if d.id_tratamiento:
                    tratamientos.append({
                        'nombre': d.id_tratamiento.nombre,
                        'precio': d.id_tratamiento.precio
                    })
                if d.id_medicamento:
                    medicamentos.append({
                        'nombre': d.id_medicamento.nombre,
                        'precio': d.id_medicamento.precio,
                        'cantidad': d.cantidad
                    })
            result.append({
                'id': s.id,
                'fecha': s.fecha,
                'total': str(s.total) if s.total else '0.00',
                'tratamientos': tratamientos,
                'medicamentos': medicamentos
            })
        return result

    def get_paciente_nombre(self, obj):
        return f"{obj.id_paciente.nombre} {obj.id_paciente.apellido}"

    def validate(self, data):
        if self.instance:
            if ('hora_ingreso' in data) != ('hora_salida' in data):
                raise serializers.ValidationError(
                    "hora_ingreso y hora_salida deben actualizarse juntos."
                )
        return data
