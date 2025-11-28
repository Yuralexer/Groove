from django.db import models
from django.conf import settings
from music.models import Track


class Playlist(models.Model):
    title = models.CharField(max_length=255)
    cover = models.ImageField(upload_to='playlists/', blank=True, null=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='playlists'
    )

    tracks = models.ManyToManyField(Track, related_name='playlists', blank=True)

    is_favorite = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.owner.email})"
