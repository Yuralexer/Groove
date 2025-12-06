import { create } from 'zustand';
import { Track } from '@/lib/music';

type QueueContext = 'album' | 'playlist' | 'search' | null;
type LoopMode = 'no-repeat' | 'repeat-playlist' | 'repeat-track';

interface PlayerState {
    activeTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    currentIndex: number;
    queueContext: QueueContext;
    loopMode: LoopMode;
    isShuffleEnabled: boolean;
    playedTrackIds: Set<number>;
    
    playTrack: (track: Track, queue?: Track[], context?: QueueContext) => void;
    togglePlay: () => void;
    setIsPlaying: (status: boolean) => void;
    playNext: () => void;
    playPrevious: () => void;
    clearQueue: () => void;
    canPlayNext: () => boolean;
    canPlayPrevious: () => boolean;
    cycleLoopMode: () => void;
    toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    activeTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    queueContext: null,
    loopMode: 'no-repeat',
    isShuffleEnabled: false,
    playedTrackIds: new Set(),

    playTrack: (track, queue = [], context = null) => {
        const newQueue = queue.length > 0 ? queue : [track];
        const index = newQueue.findIndex(t => t.id === track.id);
        set({ 
            activeTrack: track, 
            isPlaying: true,
            queue: newQueue,
            currentIndex: index >= 0 ? index : 0,
            queueContext: context,
            playedTrackIds: new Set()
        });
    },

    togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
    },

    setIsPlaying: (status) => {
        set({ isPlaying: status });
    },

    playNext: () => {
        const { queue, currentIndex, loopMode, isShuffleEnabled, playedTrackIds, activeTrack } = get();
        
        if (queue.length === 0) return;

        if (activeTrack) {
            playedTrackIds.add(activeTrack.id);
        }

        if (loopMode === 'no-repeat') {
            if (currentIndex < queue.length - 1) {
                let nextIndex: number;
                
                if (isShuffleEnabled) {
                    const availableIndices = queue
                        .map((track, idx) => idx)
                        .filter(idx => !playedTrackIds.has(queue[idx].id));
                    
                    if (availableIndices.length === 0) {
                        playedTrackIds.clear();
                        nextIndex = Math.floor(Math.random() * queue.length);
                    } else {
                        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                    }
                } else {
                    nextIndex = currentIndex + 1;
                }
                
                const nextTrack = queue[nextIndex];
                set({
                    activeTrack: nextTrack,
                    currentIndex: nextIndex,
                    isPlaying: true,
                    playedTrackIds: new Set(playedTrackIds)
                });
            }
            return;
        }

        if (loopMode === 'repeat-playlist') {
            let nextIndex: number;
            
            if (isShuffleEnabled) {
                const availableIndices = queue
                    .map((track, idx) => idx)
                    .filter(idx => !playedTrackIds.has(queue[idx].id));
                
                if (availableIndices.length === 0) {
                    playedTrackIds.clear();
                    nextIndex = Math.floor(Math.random() * queue.length);
                } else {
                    nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                }
            } else {
                nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
            }
            
            const nextTrack = queue[nextIndex];
            set({
                activeTrack: nextTrack,
                currentIndex: nextIndex,
                isPlaying: true,
                playedTrackIds: new Set(playedTrackIds)
            });
            return;
        }

        if (loopMode === 'repeat-track') {
            set({
                activeTrack: get().activeTrack,
                isPlaying: true
            });
            return;
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
            queueContext: null,
            playedTrackIds: new Set()
        });
    },

    canPlayNext: () => {
        const { queue, currentIndex, loopMode } = get();
        if (queue.length === 0) return false;
        
        if (loopMode === 'repeat-playlist' || loopMode === 'repeat-track') {
            return true;
        }

        return currentIndex < queue.length - 1;
    },

    canPlayPrevious: () => {
        const { queue, currentIndex } = get();
        return queue.length > 0 && currentIndex > 0;
    },

    cycleLoopMode: () => {
        set((state) => {
            const modes: LoopMode[] = ['no-repeat', 'repeat-playlist', 'repeat-track'];
            const currentIndex = modes.indexOf(state.loopMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            return { loopMode: modes[nextIndex] };
        });
    },

    toggleShuffle: () => {
        set((state) => ({ isShuffleEnabled: !state.isShuffleEnabled }));
    }
}));