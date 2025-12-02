"use client";

import { useEffect, useState } from "react";
import { playlistApi, PlaylistDetail } from "@/lib/playlists";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getImageUrl } from "@/lib/music";
import { formatTime } from "@/lib/utils";
import { Heart } from "lucide-react";
import styles from "./favorites.module.css";

export default function FavoritesPage() {
    const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
    const [loading, setLoading] = useState(true);
    
    const { playTrack, activeTrack } = usePlayerStore();

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                // 1. Ищем ID любимого плейлиста
                const allPlaylists = await playlistApi.getMyPlaylists();
                const fav = allPlaylists.find(p => p.is_favorite);
                
                if (fav) {
                    // 2. Грузим его треки
                    const details = await playlistApi.getPlaylist(fav.id);
                    setPlaylist(details);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadFavorites();
    }, []);

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (!playlist) return <div className="p-8">Плейлист "Любимое" не найден.</div>;

    return (
        <div className={styles.container}>
            {/* Шапка */}
            <div className={styles.header}>
                <div className={styles.heartBox}>
                    <Heart fill="white" size={80} />
                </div>
                <div className={styles.info}>
                    <div className={styles.type}>Плейлист</div>
                    <h1 className={styles.title}>Любимые треки</h1>
                    <div className={styles.meta}>
                        {playlist.owner} • {playlist.tracks.length} треков
                    </div>
                </div>
            </div>

            {/* Треки */}
            <div className={styles.trackList}>
                {playlist.tracks.map((track, index) => {
                    const isCurrent = activeTrack?.id === track.id;
                    return (
                        <div 
                            key={track.id} 
                            className={styles.trackRow}
                            onClick={() => playTrack(track, playlist.tracks, 'playlist')}
                        >
                            <div className={styles.trackNum}>{isCurrent ? "▶" : index + 1}</div>
                            
                            <div 
                                className={styles.trackImage}
                                style={{ backgroundImage: track.cover ? `url(${getImageUrl(track.cover)})` : undefined }}
                            >
                                {!track.cover && "♫"}
                            </div>

                            <div className={styles.trackInfo}>
                                <div className={`${styles.trackTitle} ${isCurrent ? styles.activeText : ''}`}>
                                    {track.title}
                                </div>
                                <div className={styles.trackArtist}>
                                    {track.artist || "Неизвестен"}
                                </div>
                            </div>
                            <div className={styles.trackTime}>{formatTime(track.duration)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}