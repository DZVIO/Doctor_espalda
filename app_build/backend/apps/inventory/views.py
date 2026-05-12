from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from .models import FormaFarmaceutica, UnidadMedida, Marca, Presentacion, Medicamento
from .serializers import (
    FormaFarmaceuticaSerializer,
    UnidadMedidaSerializer,
    MarcaSerializer,
    PresentacionSerializer,
    MedicamentoSerializer
)

class FormaFarmaceuticaViewSet(viewsets.ModelViewSet):
    queryset = FormaFarmaceutica.objects.all()
    serializer_class = FormaFarmaceuticaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['forma']
    ordering_fields = ['created_at', 'forma']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "No se puede eliminar esta forma farmacéutica porque tiene presentaciones asociadas."},
                status=status.HTTP_400_BAD_REQUEST
            )


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    queryset = UnidadMedida.objects.all()
    serializer_class = UnidadMedidaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'tipo']
    search_fields = ['unidad', 'abreviatura']
    ordering_fields = ['created_at', 'unidad', 'tipo']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "No se puede eliminar esta unidad de medida porque tiene presentaciones asociadas."},
                status=status.HTTP_400_BAD_REQUEST
            )


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['marca']
    ordering_fields = ['created_at', 'marca']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "No se puede eliminar esta marca porque tiene medicamentos asociados."},
                status=status.HTTP_400_BAD_REQUEST
            )


class PresentacionViewSet(viewsets.ModelViewSet):
    queryset = Presentacion.objects.all()
    serializer_class = PresentacionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'forma_farmaceutica', 'unidad_medida']
    search_fields = ['concentracion']
    ordering_fields = ['created_at', 'cantidad']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "No se puede eliminar esta presentación porque tiene medicamentos asociados."},
                status=status.HTTP_400_BAD_REQUEST
            )


class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'marca', 'presentacion']
    search_fields = ['nombre']
    ordering_fields = ['created_at', 'nombre', 'precio', 'cantidad']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "No se puede eliminar este medicamento porque tiene seguimientos asociados."},
                status=status.HTTP_400_BAD_REQUEST
            )
