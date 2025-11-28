from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from .models import Playlist
from music.models import Track
from .serializers import PlaylistListSerializer, PlaylistDetailSerializer


class MyPlaylistListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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

    def get_object(self, pk, user):
        return get_object_or_404(Playlist, pk=pk, owner=user)
    
    def get(self, request, pk):
        playlist = self.get_object(pk, request.user)
        serializer = PlaylistDetailSerializer(playlist, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        playlist = self.get_object(pk, request.user)
        
        if playlist.is_favorite:
            return Response(
                {"error": "Нельзя удалить плейлист 'Любимое'"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

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
