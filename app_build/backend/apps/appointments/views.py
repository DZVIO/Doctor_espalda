from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import Agendamiento
from .serializers import AgendamientoSerializer
from .services import AgendamientoService


class AgendamientoViewSet(viewsets.ModelViewSet):
    queryset = Agendamiento.objects.all().select_related('id_paciente')
    serializer_class = AgendamientoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'fecha': ['exact', 'gte', 'lte'],
        'id_paciente': ['exact'],
    }
    search_fields = [
        'id_paciente__nombre',
        'id_paciente__apellido',
        'id_paciente__cedula',
        'id_paciente__numero'
    ]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            agendamiento = AgendamientoService.create_agendamiento(serializer.validated_data)
            output = self.get_serializer(agendamiento)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        try:
            agendamiento = AgendamientoService.update_agendamiento(instance, serializer.validated_data)
            output = self.get_serializer(agendamiento)
            return Response(output.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        AgendamientoService.delete_agendamiento(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
