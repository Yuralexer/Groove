from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Playlist


User = get_user_model()


@receiver(post_save, sender=User)
def create_favorite_playlist(sender, instance, created, **kwargs):
    if created:
        Playlist.objects.create(
            owner=instance,
            title="Любимое",
            is_favorite=True
        )