import { create } from 'zustand';
import { Track } from '@/lib/music';

type QueueContext = 'album' | 'playlist' | 'search' | null;

interface PlayerState {
    activeTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    currentIndex: number;
    queueContext: QueueContext;
    
    playTrack: (track: Track, queue?: Track[], context?: QueueContext) => void;
    togglePlay: () => void;
    setIsPlaying: (status: boolean) => void;
    playNext: () => void;
    playPrevious: () => void;
    clearQueue: () => void;
    canPlayNext: () => boolean;
    canPlayPrevious: () => boolean;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    activeTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    queueContext: null,

    playTrack: (track, queue = [], context = null) => {
        const newQueue = queue.length > 0 ? queue : [track];
        const index = newQueue.findIndex(t => t.id === track.id);
        set({ 
            activeTrack: track, 
            isPlaying: true,
            queue: newQueue,
            currentIndex: index >= 0 ? index : 0,
            queueContext: context
        });
    },

    togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
    },

    setIsPlaying: (status) => {
        set({ isPlaying: status });
    },

    playNext: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
            const nextTrack = queue[currentIndex + 1];
            set({
                activeTrack: nextTrack,
                currentIndex: currentIndex + 1,
                isPlaying: true
            });
        }
    },

    playPrevious: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0) {
            const prevTrack = queue[currentIndex - 1];
            set({
                activeTrack: prevTrack,
                currentIndex: currentIndex - 1,
                isPlaying: true
            });
        }
    },

    clearQueue: () => {
        set({
            activeTrack: null,
            isPlaying: false,
            queue: [],
            currentIndex: -1,
            queueContext: null
        });
    },

    canPlayNext: () => {
        const { queue, currentIndex } = get();
        return queue.length > 0 && currentIndex < queue.length - 1;
    },

    canPlayPrevious: () => {
        const { queue, currentIndex } = get();
        return queue.length > 0 && currentIndex > 0;
    }
}));