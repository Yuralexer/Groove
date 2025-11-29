import api from './api';

export interface Artist {
    id: number;
    name: string;
    image: string;
}

export interface Album {
    id: number;
    title: string;
    artist: string;
    cover: string;
    release_date: string;
}

export interface Track {
    id: number;
    title: string;
    file: string;
    duration: number;
    plays_count: number;
    cover?: string;
    artist?: string;
}

export const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder.png';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
};

export interface Artist {
    id: number;
    name: string;
    image: string;
    description?: string;
    albums?: Album[]; 
}

export const musicApi = {
    getAllAlbums: async () => {
        const response = await api.get<Album[]>('/music/albums/');
        return response.data;
    },
    
    getRecommendations: async () => {
        const response = await api.get<Track[]>('/music/recommendations/');
        return response.data;
    },

    getAlbumDetails: async (id: number) => {
        const response = await api.get(`/music/albums/${id}/`);
        return response.data;
    },

    searchTracks: async (query: string) => {
        const response = await api.get<Track[]>(`/music/tracks/?search=${query}`);
        return response.data;
    },
    
    searchAlbums: async (query: string) => {
        const response = await api.get<Album[]>(`/music/albums/?search=${query}`);
        return response.data;
    },
    
    searchArtists: async (query: string) => {
        const response = await api.get<Artist[]>(`/music/artists/?search=${query}`);
        return response.data;
    },

    getArtistDetails: async (id: number) => {
        const response = await api.get<Artist>(`/music/artists/${id}/`); // Этот метод вернет инфо + альбомы
        return response.data;
    },

    getArtistTracks: async (artistId: number) => {
        const response = await api.get<Track[]>(`/music/tracks/?artist_id=${artistId}`);
        return response.data;
    },
};