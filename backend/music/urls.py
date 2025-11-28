from django.urls import path
from .views import (
    ArtistListAPIView, ArtistDetailAPIView,
    AlbumListAPIView, AlbumDetailAPIView,
    TrackListAPIView, RecommendationAPIView,
)


urlpatterns = [
    path('artists/', ArtistListAPIView.as_view()),
    path('artists/<int:pk>/', ArtistDetailAPIView.as_view()),
    
    path('albums/', AlbumListAPIView.as_view()),
    path('albums/<int:pk>/', AlbumDetailAPIView.as_view()),

    path('tracks/', TrackListAPIView.as_view()),
    path('recommendations/', RecommendationAPIView.as_view()),
]