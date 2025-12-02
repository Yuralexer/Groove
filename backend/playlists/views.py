from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import Playlist
from music.models import Track
from .serializers import PlaylistListSerializer, PlaylistDetailSerializer
from rest_framework.permissions import IsAuthenticated


class MyPlaylistListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        playlists = Playlist.objects.filter(owner=request.user)
        serializer = PlaylistListSerializer(playlists, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = PlaylistListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlaylistDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk, user):
        return get_object_or_404(Playlist, pk=pk, owner=user)
    
    def get(self, request, pk):
        playlist = self.get_object(pk, request.user)
        serializer = PlaylistDetailSerializer(playlist, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        """Полное обновление плейлиста (title, cover, description)."""
        playlist = self.get_object(pk, request.user)
        serializer = PlaylistListSerializer(playlist, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """Частичное обновление плейлиста."""
        playlist = self.get_object(pk, request.user)
        serializer = PlaylistListSerializer(playlist, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        playlist = self.get_object(pk, request.user)
        
        if playlist.is_favorite:
            return Response(
                {"error": "Нельзя удалить плейлист 'Любимое'"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class FavoritePlaylistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, track_id):
        """Добавить трек в плейлист 'Любимое' пользователя (создаётся, если отсутствует)."""
        user = request.user
        track = get_object_or_404(Track, pk=track_id)

        fav, created = Playlist.objects.get_or_create(owner=user, is_favorite=True, defaults={'title': 'Любимое'})
        fav.tracks.add(track)
        return Response({'status': 'added', 'playlist_id': fav.id}, status=status.HTTP_200_OK)

    def delete(self, request, track_id):
        user = request.user
        track = get_object_or_404(Track, pk=track_id)
        fav = Playlist.objects.filter(owner=user, is_favorite=True).first()
        if not fav:
            return Response({'status': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
        fav.tracks.remove(track)
        return Response({'status': 'removed', 'playlist_id': fav.id}, status=status.HTTP_200_OK)


class PlaylistTrackAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, track_id):
        """Добавить трек в плейлист"""
        playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        track = get_object_or_404(Track, pk=track_id)
        
        playlist.tracks.add(track)
        return Response({"status": "Track added"}, status=status.HTTP_200_OK)

    def delete(self, request, pk, track_id):
        """Удалить трек из плейлиста"""
        playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        track = get_object_or_404(Track, pk=track_id)
        
        playlist.tracks.remove(track)
        return Response({"status": "Track removed"}, status=status.HTTP_200_OK)
