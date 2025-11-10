from rest_framework import serializers
from .models import Player, Category, Acudiente

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class AcudienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Acudiente
        fields = ['id', 'nombre', 'documento', 'correo', 'telefono', 'direccion', 'profesion', 'created_at', 'updated_at']

class PlayerSerializer(serializers.ModelSerializer):
    # allow writing the acudiente string when creating/updating players from the frontend
    acudiente = serializers.CharField(required=False, allow_blank=True)
    categoria = CategorySerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='categoria', write_only=True, required=False, allow_null=True)

    class Meta:
        model = Player
        fields = ['id', 'nombre', 'fecha_nacimiento', 'documento', 'acudiente', 'estrato', 'jornada', 'sede', 'categoria', 'categoria_id', 'created_at', 'updated_at']
