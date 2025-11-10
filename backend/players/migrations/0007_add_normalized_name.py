from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('players', '0006_remove_uniformej_player_remove_uniformep_player_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='normalized_name',
            field=models.CharField(max_length=120, null=True, blank=True, db_index=True),
        ),
    ]
