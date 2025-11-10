from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('players', '0007_add_normalized_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='category',
            name='normalized_name',
            field=models.CharField(max_length=120, unique=True, null=True, blank=True, db_index=True),
        ),
    ]
