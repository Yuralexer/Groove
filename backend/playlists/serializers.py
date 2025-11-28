from rest_framework import serializers
from .models import Playlist
from music.serializers import TrackSerializer


class PlaylistListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ['id', 'title', 'cover', 'is_favorite']

class PlaylistDetailSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    owner = serializers.StringRelatedField()

    class Meta:
        model = Playlist
        fields = ['id', 'title', 'cover', 'description', 'owner', 'is_favorite', 'tracks']
