"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Для получения ID из URL
import { playlistApi, PlaylistDetail } from "@/lib/playlists";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getImageUrl } from "@/lib/music";
import { formatTime } from "@/lib/utils";
import { Music } from "lucide-react"; // Иконка ноты для заглушки
import styles from "./playlist.module.css";
import Link from "next/link";
import TrackRow from "@/components/TrackRow";

export default function PlaylistPage() {
    const params = useParams();
    const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
    const [loading, setLoading] = useState(true);
    
    const { playTrack, activeTrack } = usePlayerStore();

    useEffect(() => {
        const loadPlaylist = async () => {
            try {
                // Берем ID из URL
                const details = await playlistApi.getPlaylist(Number(params.id));
                setPlaylist(details);
            } catch (e) {
                console.error("Ошибка загрузки плейлиста", e);
            } finally {
                setLoading(false);
            }
        };
        
        if (params.id) {
            loadPlaylist();
        }
    }, [params.id]);

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (!playlist) return <div className="p-8">Плейлист не найден.</div>;

    return (
        <div className={styles.container}>
            {/* Шапка */}
            <div className={styles.header}>
                {/* Обложка: Если есть картинка - показываем, если нет - иконку */}
                <div 
                    className={styles.coverPlaceholder}
                    style={{ 
                        backgroundImage: playlist.cover ? `url(${getImageUrl(playlist.cover)})` : undefined 
                    }}
                >
                    {!playlist.cover && <Music size={80} color="#555" />}
                </div>

                <div className={styles.info}>
                    <div className={styles.type}>Плейлист</div>
                    {/* Настоящее название плейлиста */}
                    <h1 className={styles.title}>{playlist.title}</h1>
                    <div style={{ marginTop: 12 }}>
                        {!playlist.is_favorite && (
                            <Link href={`/playlist/${playlist.id}/edit`} className={styles.editButton}>Изменить</Link>
                        )}
                    </div>
                    <div className={styles.meta}>
                        {playlist.owner} • {playlist.tracks.length} треков
                    </div>
                    <div style={{fontSize: 14, color: '#ccc', marginTop: 5}}>
                        {playlist.description}
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