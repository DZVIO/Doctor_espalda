from rest_framework.routers import DefaultRouter
from .views import TratamientoViewSet, SesionViewSet

router = DefaultRouter()
router.register(r'tratamientos', TratamientoViewSet)
router.register(r'sesiones', SesionViewSet)

urlpatterns = router.urls
