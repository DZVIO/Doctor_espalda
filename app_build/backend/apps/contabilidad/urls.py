from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PagoViewSet, obtener_metricas_financieras

router = DefaultRouter()
router.register('contabilidad/pagos', PagoViewSet, basename='pago')

urlpatterns = [
    path('contabilidad/metricas/', obtener_metricas_financieras, name='metricas-financieras'),
    path('', include(router.urls)),
]
