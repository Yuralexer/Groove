import random
import mimetypes
from django.http import FileResponse, Http404, HttpResponse
import os

from django.db.models import Q, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .models import Track, Artist, Album
from .serializers import (
    ArtistListSerializer, ArtistDetailSerializer,
    AlbumListSerializer, AlbumDetailSerializer,
    AlbumCreateSerializer, TrackSerializer,
)
from playlists.models import Playlist


class ArtistListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    @method_decorator(cache_page(60 * 5, key_prefix='artist_list'))
    def get(self, request):
        artists = Artist.objects.all()
        search_query = request.query_params.get('search', None)

        if search_query:
            artists = artists.filter(name__icontains=search_query)

        tag_slug = request.query_params.get('tag', None)

        if tag_slug:
            artists = artists.filter(tags__slug=tag_slug)
            
        serializer = ArtistListSerializer(artists, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = AlbumCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ArtistDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @method_decorator(cache_page(60 * 5, key_prefix='artist_detail'))
    def get(self, request, pk):
        artist = get_object_or_404(Artist, pk=pk)
        serializer = ArtistDetailSerializer(artist, context={'request': request})
        return Response(serializer.data)


class AlbumListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    @method_decorator(cache_page(60 * 5, key_prefix='album_list'))
    def get(self, request):
        queryset = Album.objects.all()
        
        search_query = request.query_params.get('search', None)
        tag_slug = request.query_params.get('tag', None)

        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(artist__name__icontains=search_query)
            )
        
        if tag_slug:
            queryset = queryset.filter(tags__slug=tag_slug)
        
        queryset = queryset.order_by('-release_date').distinct()

        serializer = AlbumListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


    def post(self, request):
        serializer = AlbumListSerializer(data=request.data) 
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class AlbumDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @method_decorator(cache_page(60 * 5, key_prefix='album_detail'))
    def get(self, request, pk):
        album = get_object_or_404(Album, pk=pk)
        serializer = AlbumDetailSerializer(album, context={'request': request})
        return Response(serializer.data)


class TrackListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @method_decorator(cache_page(60 * 5, key_prefix='track_list'))
    def get(self, request):
        queryset = Track.objects.all()
        search_query = request.query_params.get('search', None)
        tag_slug = request.query_params.get('tag', None)

        artist_id = request.query_params.get('artist_id', None)

        if artist_id:
            queryset = queryset.filter(album__artist_id=artist_id)
            queryset = queryset.order_by('-plays_count')

        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(album__artist__name__icontains=search_query)
            )

        if tag_slug:
            queryset = queryset.filter(tags__slug=tag_slug)

        if not artist_id:
            queryset = queryset.order_by('-id').distinct()

        if not artist_id and not search_query:
            queryset = queryset.order_by('-id').distinct()
        else:
            queryset = queryset.distinct()
        serializer = TrackSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class RecommendationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        favorite_playlist = Playlist.objects.filter(owner=user, is_favorite=True).first()
        if not favorite_playlist:
            return Response([])
        
        favorite_tracks = favorite_playlist.tracks.all()
        favorite_track_ids = favorite_tracks.values_list('id', flat=True)
        liked_tags_ids = favorite_tracks.values_list('tags__id', flat=True).distinct()

        if not liked_tags_ids:
            return Response({"message": "Добавьте треки с тегами в любимое для рекомендаций"})
        
        recommendations = Track.objects.filter(
            tags__id__in=liked_tags_ids
        ).exclude(
            id__in=favorite_track_ids
        ).distinct()

        recommendations_list = list(recommendations)
        if len(recommendations_list) > 5:
            recommendations_list = random.sample(recommendations_list, 5)
        
        serializer = TrackSerializer(recommendations_list, many=True, context={'request': request})
        return Response(serializer.data)


class TrackStreamView(APIView):
    """Stream a track file and increment its plays_count. Supports HTTP Range requests for seeking."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        track = get_object_or_404(Track, pk=pk)
        
        range_header = request.META.get('HTTP_RANGE', '')
        should_count = False
        if not range_header:
            should_count = True
        else:
            if range_header.startswith('bytes=0'):
                should_count = True

        if should_count:
            Track.objects.filter(pk=pk).update(plays_count=F('plays_count') + 1)

        try:
            file_path = track.file.path
            file_size = os.path.getsize(file_path)
            
            mime, _ = mimetypes.guess_type(track.file.name)
            content_type = mime or 'application/octet-stream'
            
            range_header = request.META.get('HTTP_RANGE', '')
            
            if range_header:
                try:
                    range_match = range_header.replace('bytes=', '')
                    start, end = range_match.split('-')
                    
                    start = int(start) if start else 0
                    end = int(end) if end else file_size - 1
                    
                    if start < 0 or end >= file_size or start > end:
                        return HttpResponse(status=416)
                    
                    with open(file_path, 'rb') as f:
                        f.seek(start)
                        content = f.read(end - start + 1)
                    
                    response = HttpResponse(content, status=206, content_type=content_type)
                    response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
                    response['Content-Length'] = len(content)
                    response['Accept-Ranges'] = 'bytes'
                    response['Content-Disposition'] = 'inline'
                    return response
                    
                except (ValueError, IndexError):
                    pass
            
            with open(file_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type=content_type)
            
            response['Accept-Ranges'] = 'bytes'
            response['Content-Length'] = file_size
            response['Content-Disposition'] = 'inline'
            return response
            
        except Exception as e:
            print(f"Error streaming track {pk}: {e}")
            raise Http404
