from rest_framework import serializers
from .models import Tag, Artist, Album, Track


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class TrackSerializer(serializers.ModelSerializer):
    cover = serializers.ImageField(source='album.cover', read_only=True)
    artist = serializers.CharField(source='album.artist.name', read_only=True)
    artist_id = serializers.IntegerField(source='album.artist.id', read_only=True)
    artist_image = serializers.ImageField(source='album.artist.image', read_only=True)
    class Meta:
        model = Track
        fields = ['id', 'title', 'file', 'duration', 'order', 'plays_count', 'cover', 'artist', 'artist_id', 'artist_image']


class ArtistListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'image']


class AlbumListSerializer(serializers.ModelSerializer):
    artist = serializers.StringRelatedField()
    
    class Meta:
        model = Album
        fields = ['id', 'title', 'cover', 'artist', 'release_date']


class ArtistDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    albums = AlbumListSerializer(many=True, read_only=True)

    class Meta:
        model = Artist
        fields = ['id', 'name', 'image', 'header_image', 'description', 'tags', 'albums']


class AlbumDetailSerializer(serializers.ModelSerializer):
    artist = ArtistListSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tracks = TrackSerializer(many=True, read_only=True) 

    class Meta:
        model = Album
        fields = ['id', 'title', 'cover', 'artist', 'description', 'release_date', 'tags', 'tracks']


class AlbumCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['title', 'artist', 'cover', 'release_date', 'description']
