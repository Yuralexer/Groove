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
    // Получить все мои плейлисты
    getMyPlaylists: async () => {
        const response = await api.get<Playlist[]>('/playlists/my/');
        return response.data;
    },

    // Получить детали плейлиста (треки)
    getPlaylist: async (id: number) => {
        const response = await api.get<PlaylistDetail>(`/playlists/${id}/`);
        return response.data;
    },

    // Добавить трек (на будущее)
    addTrack: async (playlistId: number, trackId: number) => {
        return api.post(`/playlists/${playlistId}/tracks/${trackId}/`);
    },

    // Удалить трек (на будущее)
    removeTrack: async (playlistId: number, trackId: number) => {
        return api.delete(`/playlists/${playlistId}/tracks/${trackId}/`);
    }
};