from rest_framework import viewsets, permissions
from .models import Player, Category, Acudiente
from .serializers import PlayerSerializer, CategorySerializer, AcudienteSerializer

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all().order_by('-created_at')
    serializer_class = PlayerSerializer
    # Allow read-only access to unauthenticated users (list/retrieve),
    # but require authentication for create/update/delete.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class AcudienteViewSet(viewsets.ModelViewSet):
    queryset = Acudiente.objects.all().order_by('-created_at')
    serializer_class = AcudienteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
