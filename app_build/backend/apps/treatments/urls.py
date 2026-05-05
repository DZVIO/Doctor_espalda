from rest_framework.routers import DefaultRouter
from .views import TratamientoViewSet, SeguimientoViewSet

router = DefaultRouter()
router.register(r'tratamientos', TratamientoViewSet)
router.register(r'seguimientos', SeguimientoViewSet)

urlpatterns = router.urls
