from rest_framework import serializers
from .models import Playlist
from music.serializers import TrackSerializer
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO


class PlaylistListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ['id', 'title', 'cover', 'is_favorite']

    def validate_cover(self, value):
        """Проверяем, что загруженное изображение квадратно."""
        if not value:
            return value

        # value может быть InMemoryUploadedFile или похожим
        try:
            img = Image.open(value)
            width, height = img.size
        except Exception:
            raise serializers.ValidationError('Невозможно прочитать изображение')

        if width != height:
            raise serializers.ValidationError('Обложка плейлиста должна быть квадратной (ширина == высота)')

        # rewind file pointer if needed
        try:
            value.seek(0)
        except Exception:
            pass

        return value

class PlaylistDetailSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    owner = serializers.StringRelatedField()

    class Meta:
        model = Playlist
        fields = ['id', 'title', 'cover', 'description', 'owner', 'is_favorite', 'tracks']
