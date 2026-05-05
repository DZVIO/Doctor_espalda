from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)

urlpatterns = router.urls
