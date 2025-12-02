from django.urls import path
from .views import MyPlaylistListAPIView, PlaylistDetailAPIView, PlaylistTrackAPIView, FavoritePlaylistAPIView

urlpatterns = [
    path('my/', MyPlaylistListAPIView.as_view()),
    path('<int:pk>/', PlaylistDetailAPIView.as_view()),
    path('<int:pk>/tracks/<int:track_id>/', PlaylistTrackAPIView.as_view()),
    path('favorite/<int:track_id>/', FavoritePlaylistAPIView.as_view()),
]