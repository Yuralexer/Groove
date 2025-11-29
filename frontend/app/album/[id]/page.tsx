"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Хук для получения ID из URL
import { musicApi, getImageUrl } from "@/lib/music";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { Play } from "lucide-react"; // Иконка Play для большой кнопки
import styles from "./album.module.css";

// Тип, который возвращает бэк (AlbumDetailSerializer)
// Мы его расширяем прямо тут, или берем из lib/music, если там всё описано
interface AlbumDetail {
    id: number;
    title: string;
    artist: string;
    cover: string;
    release_date: string;
    tracks: {
        id: number;
        title: string;
        file: string;
        duration: number;
        plays_count: number;
    }[];
}

export default function AlbumPage() {
    const params = useParams();
    const { playTrack, activeTrack, isPlaying, setIsPlaying } = usePlayerStore();
    
    const [album, setAlbum] = useState<AlbumDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAlbum = async () => {
            try {
                // params.id это строка, приводим к числу
                const data = await musicApi.getAlbumDetails(Number(params.id));
                setAlbum(data);
            } catch (e) {
                console.error("Failed to load album", e);
            } finally {
                setLoading(false);
            }
        };
        loadAlbum();
    }, [params.id]);

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (!album) return <div className="p-8">Альбом не найден</div>;

    // Функция запуска трека
    const handlePlay = (track: AlbumDetail['tracks'][0]) => {
        playTrack({
            ...track, // Копируем данные трека
            cover: album.cover, // Добавляем обложку альбома вручную!
            artist: album.artist // И имя артиста
        });
    };

    return (
        <div className={styles.container}>
            {/* Шапка */}
            <div className={styles.header}>
                <div 
                    className={styles.cover} 
                    style={{ backgroundImage: `url(${getImageUrl(album.cover)})` }}
                />
                <div className={styles.info}>
                    <span className={styles.type}>Альбом</span>
                    <div className="marqueeWrapper" style={{ maxWidth: '70vw' }}>
                        <h1 className={`marqueeContent ${styles.title}`}>
                            {album.title}
                        </h1>
                    </div>
                    <div className={styles.meta}>
                        {/* Аватарка артиста (пока заглушка) */}
                        <div style={{width: 24, height: 24, borderRadius: '50%', background: '#777'}}></div>
                        <span style={{fontWeight: 'bold'}}>{album.artist}</span>
                        <span>• {album.release_date?.split('-')[0]}</span>
                        <span>• {album.tracks.length} треков</span>
                    </div>
                </div>
            </div>

            {/* Список треков */}
            <div className={styles.trackList}>
                {/* Заголовки таблицы */}
                <div className={styles.trackRow} style={{ borderBottom: '1px solid #333', marginBottom: 10, fontSize: 12, textTransform: 'uppercase' }}>
                    <div className="text-center">#</div>
                    <div>Название</div>
                    <div className="text-right">Время</div>
                </div>

                {album.tracks.map((track, index) => {
                    // Проверяем, играет ли этот трек прямо сейчас
                    const isCurrent = activeTrack?.id === track.id;

                    return (
                        <div 
                            key={track.id} 
                            className={styles.trackRow}
                            onClick={() => handlePlay(track)}
                        >
                            <div className={`${styles.trackNum} ${isCurrent ? styles.activeTrack : ''}`}>
                                {/* Если трек играет - показываем иконку эквалайзера (или просто Play), иначе номер */}
                                {isCurrent ? "▶" : index + 1}
                            </div>
                            <div>
                                <div className={`${styles.trackTitle} ${isCurrent ? styles.activeTrack : ''}`}>
                                    {track.title}
                                </div>
                                <div className={styles.trackArtist}>{album.artist}</div>
                            </div>
                            <div className="text-right font-variant-numeric">
                                {formatTime(track.duration)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}