from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    # normalized_name: canonical form (no spaces, lowercase) used for dedup and unique constraint later
    normalized_name = models.CharField(max_length=120, null=True, blank=True, db_index=True)

    def save(self, *args, **kwargs):
        # derive normalized form used for deduplication: strip whitespace and lowercase
        try:
            import re
            if self.name:
                self.normalized_name = re.sub(r"\s+", "", str(self.name)).strip().lower()
            else:
                self.normalized_name = None
        except Exception:
            try:
                self.normalized_name = str(self.name or '').strip().lower()
            except Exception:
                self.normalized_name = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Acudiente(models.Model):
    nombre = models.CharField(max_length=255)
    documento = models.CharField(max_length=100, blank=True)
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    profesion = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

class Player(models.Model):
    nombre = models.CharField(max_length=255)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    documento = models.CharField(max_length=100, blank=True)
    acudiente = models.CharField(max_length=255, blank=True)
    estrato = models.CharField(max_length=50, blank=True)
    jornada = models.CharField(max_length=100, blank=True)
    sede = models.CharField(max_length=100, blank=True)
    # Use db_column='category_id' to match the existing DB column name
    # (some migrations or earlier schema used 'category_id').
    categoria = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='players',
        db_column='category_id'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre
