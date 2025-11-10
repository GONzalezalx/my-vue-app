from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet, CategoryViewSet, AcudienteViewSet

router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'acudientes', AcudienteViewSet, basename='acudiente')

urlpatterns = router.urls
