import { create } from 'zustand';
import { Track } from '@/lib/music';

interface PlayerState {
    activeTrack: Track | null;
    isPlaying: boolean;
    
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    setIsPlaying: (status: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    activeTrack: null,
    isPlaying: false,

    playTrack: (track) => {
        set({ activeTrack: track, isPlaying: true });
    },

    togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
    },

    setIsPlaying: (status) => {
        set({ isPlaying: status });
    }
}));