# pyrefly: ignore [missing-import]
from rest_framework import viewsets, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
# pyrefly: ignore [missing-import]
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Tratamiento, Sesion, DetalleSesion
from .serializers import TratamientoSerializer, SesionSerializer, DetalleSesionSerializer
from .services import TratamientoService, SesionService, DetalleSesionService


class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['nombre']
    ordering_fields = ['created_at', 'nombre', 'precio']
    ordering = ['-created_at']

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


class SesionViewSet(viewsets.ModelViewSet):
    queryset = Sesion.objects.prefetch_related('detalles').all()
    serializer_class = SesionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_paciente', 'fecha']
    ordering_fields = ['fecha', 'hora', 'created_at', 'total']
    ordering = ['-fecha', '-hora']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            sesion = SesionService.create_sesion(serializer.validated_data)
            output = self.get_serializer(sesion)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        try:
            sesion = SesionService.update_sesion(instance, serializer.validated_data)
            output = self.get_serializer(sesion)
            return Response(output.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            SesionService.delete_sesion(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='detalles')
    def add_detalle(self, request, pk=None):
        sesion = self.get_object()
        serializer = DetalleSesionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            detalle = DetalleSesionService.create_detalle(sesion, serializer.validated_data)
            output = DetalleSesionSerializer(detalle)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'delete'], url_path=r'detalles/(?P<det_id>[^/.]+)')
    def manage_detalle(self, request, pk=None, det_id=None):
        sesion = self.get_object()
        try:
            detalle = DetalleSesion.objects.get(id=det_id, id_sesion=sesion)
            
            if request.method == 'PUT':
                # Use partial validation
                serializer = DetalleSesionSerializer(detalle, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                
                updated_detalle = DetalleSesionService.update_detalle(detalle, serializer.validated_data)
                output = DetalleSesionSerializer(updated_detalle)
                return Response(output.data)
                
            elif request.method == 'DELETE':
                DetalleSesionService.delete_detalle(detalle)
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except DetalleSesion.DoesNotExist:
            return Response({"error": "Detalle no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
