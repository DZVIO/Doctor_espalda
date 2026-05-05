from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import Tratamiento, Seguimiento
from .serializers import TratamientoSerializer, SeguimientoSerializer
from .services import TratamientoService, SeguimientoService


class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['estado']
    search_fields = ['nombre']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tratamiento = TratamientoService.create_tratamiento(serializer.validated_data)
            output = self.get_serializer(tratamiento)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        try:
            tratamiento = TratamientoService.update_tratamiento(instance, serializer.validated_data)
            output = self.get_serializer(tratamiento)
            return Response(output.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            TratamientoService.delete_tratamiento(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SeguimientoViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Seguimiento is immutable: only create, retrieve, and list are allowed."""
    queryset = Seguimiento.objects.all()
    serializer_class = SeguimientoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id_paciente', 'fecha', 'id_tratamiento']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            seguimiento = SeguimientoService.create_seguimiento(serializer.validated_data)
            output = self.get_serializer(seguimiento)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
