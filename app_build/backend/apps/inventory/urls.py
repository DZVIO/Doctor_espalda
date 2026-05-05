from rest_framework.routers import DefaultRouter
from .views import MedicamentoViewSet

router = DefaultRouter()
router.register(r'medicamentos', MedicamentoViewSet)

urlpatterns = router.urls
