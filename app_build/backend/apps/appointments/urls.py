from rest_framework.routers import DefaultRouter
from .views import AgendamientoViewSet

router = DefaultRouter()
router.register(r'agendamientos', AgendamientoViewSet)

urlpatterns = router.urls
