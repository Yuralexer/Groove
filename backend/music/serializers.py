from rest_framework import serializers
from .models import Tag, Artist, Album, Track


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class TrackSerializer(serializers.ModelSerializer):
    cover = serializers.ImageField(source='album.cover', read_only=True)
    artist = serializers.CharField(source='album.artist.name', read_only=True)
    class Meta:
        model = Track
        fields = ['id', 'title', 'file', 'duration', 'order', 'plays_count', 'cover', 'artist']


class AlbumListSerializer(serializers.ModelSerializer):
    artist = serializers.StringRelatedField()
    
    class Meta:
        model = Album
        fields = ['id', 'title', 'cover', 'artist', 'release_date']


class AlbumDetailSerializer(serializers.ModelSerializer):
    artist = serializers.StringRelatedField()
    tags = TagSerializer(many=True, read_only=True)
    tracks = TrackSerializer(many=True, read_only=True) 

    class Meta:
        model = Album
        fields = ['id', 'title', 'cover', 'artist', 'description', 'release_date', 'tags', 'tracks']


class AlbumCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['title', 'artist', 'cover', 'release_date', 'description']


class ArtistListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'image']


class ArtistDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    albums = AlbumListSerializer(many=True, read_only=True)

    class Meta:
        model = Artist
        fields = ['id', 'name', 'image', 'description', 'tags', 'albums']
