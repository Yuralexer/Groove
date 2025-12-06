import api from './api';
import { Track } from './music';

export interface Playlist {
    id: number;
    title: string;
    cover: string | null;
    is_favorite: boolean;
}

export interface PlaylistDetail extends Playlist {
    description: string;
    owner: string;
    tracks: Track[];
}

export const playlistApi = {
    getMyPlaylists: async () => {
        const response = await api.get<Playlist[]>('/playlists/my/');
        return response.data;
    },

    getPlaylist: async (id: number) => {
        const response = await api.get<PlaylistDetail>(`/playlists/${id}/`);
        return response.data;
    },

    addTrack: async (playlistId: number, trackId: number) => {
        return api.post(`/playlists/${playlistId}/tracks/${trackId}/`);
    },

    removeTrack: async (playlistId: number, trackId: number) => {
        return api.delete(`/playlists/${playlistId}/tracks/${trackId}/`);
    }
,
    createPlaylist: async (formData: FormData) => {
        return api.post('/playlists/my/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
,
    updatePlaylist: async (id: number, formData: FormData) => {
        return api.patch(`/playlists/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    deletePlaylist: async (id: number) => {
        return api.delete(`/playlists/${id}/`);
    },

    addToFavorite: async (trackId: number) => {
        return api.post(`/playlists/favorite/${trackId}/`);
    },

    removeFromFavorite: async (trackId: number) => {
        return api.delete(`/playlists/favorite/${trackId}/`);
    }
};

export default playlistApi;