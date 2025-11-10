from django.contrib import admin
from .models import Category, Player, Acudiente

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'fecha_nacimiento', 'documento', 'acudiente', 'estrato', 'categoria', 'created_at')
    list_filter = ('categoria', 'jornada', 'sede')
    search_fields = ('nombre', 'documento', 'acudiente', 'estrato')
    date_hierarchy = 'created_at'

@admin.register(Acudiente)
class AcudienteAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'documento', 'correo', 'telefono', 'direccion', 'profesion', 'created_at')
    search_fields = ('nombre', 'documento', 'correo', 'telefono')
    date_hierarchy = 'created_at'
