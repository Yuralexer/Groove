"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { musicApi, Artist, Track, getImageUrl } from "@/lib/music";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import styles from "./artist.module.css";

export default function ArtistPage() {
    const params = useParams();
    const { playTrack, activeTrack } = usePlayerStore();
    
    const [artist, setArtist] = useState<Artist | null>(null);
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const artistId = Number(params.id);
                // Загружаем параллельно инфо и топ треки
                const [artistData, tracksData] = await Promise.all([
                    musicApi.getArtistDetails(artistId),
                    musicApi.getArtistTracks(artistId)
                ]);
                
                setArtist(artistData);
                // Берем только первые 5 популярных треков
                setTopTracks(tracksData.slice(0, 5));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [params.id]);

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (!artist) return <div className="p-8">Артист не найден</div>;

    return (
        <div className={styles.container}>
            {/* Шапка */}
            <div className={styles.header}>
                <div 
                    className={styles.artistImage}
                    style={{ backgroundImage: `url(${getImageUrl(artist.image)})` }}
                />
                <div className={styles.info}>
                    <div className={styles.verified}>
                        <BadgeCheck fill="#3d91f4" color="white" size={24} />
                        Подтвержденный исполнитель
                    </div>
                    <h1 className={styles.name}>{artist.name}</h1>
                </div>
            </div>

            {/* Популярные треки */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Популярные треки</h2>
                <div className={styles.trackList}>
                    {topTracks.map((track, index) => {
                        const isCurrent = activeTrack?.id === track.id;
                        return (
                            <div 
                                key={track.id} 
                                className={styles.trackRow}
                                onClick={() => playTrack(track, topTracks, 'playlist')}
                            >
                                <div className={styles.trackNum}>
                                    {isCurrent ? "▶" : index + 1}
                                </div>
                                <div className={styles.info}>
                                    <div className={`${styles.trackTitle} ${isCurrent ? styles.activeText : ''}`}>
                                        {track.title}
                                    </div>
                                    <div className={styles.trackPlays}>
                                        {track.plays_count.toLocaleString()} прослушиваний
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', color: '#b3b3b3' }}>
                                    {formatTime(track.duration)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Дискография (Альбомы) */}
            {artist.albums && artist.albums.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Дискография</h2>
                    <div className={styles.albumGrid}>
                        {artist.albums.map(album => (
                            <Link href={`/album/${album.id}`} key={album.id} className={styles.albumCard}>
                                <div 
                                    className={styles.albumCover}
                                    style={{ backgroundImage: `url(${getImageUrl(album.cover)})` }}
                                />
                                <div className={styles.albumTitle}>{album.title}</div>
                                <div className={styles.albumYear}>
                                    {album.release_date ? album.release_date.split('-')[0] : "Сингл"} • Альбом
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}