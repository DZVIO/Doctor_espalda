from rest_framework.routers import DefaultRouter
from .views import (
    FormaFarmaceuticaViewSet,
    UnidadMedidaViewSet,
    MarcaViewSet,
    PresentacionViewSet,
    MedicamentoViewSet,
    CategoriaViewSet
)

router = DefaultRouter()
router.register(r'formas-farmaceuticas', FormaFarmaceuticaViewSet)
router.register(r'unidades-medida', UnidadMedidaViewSet)
router.register(r'marcas', MarcaViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'presentaciones', PresentacionViewSet)
router.register(r'medicamentos', MedicamentoViewSet)

urlpatterns = router.urls
