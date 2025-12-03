# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='artist',
            name='header_image',
            field=models.ImageField(blank=True, null=True, upload_to='artist_headers/'),
        ),
    ]
