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
                const [artistData, tracksData] = await Promise.all([
                    musicApi.getArtistDetails(artistId),
                    musicApi.getArtistTracks(artistId)
                ]);
                
                setArtist(artistData);
                setTopTracks(tracksData.slice(0, 6));
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

    const headerBg = artist.header_image ? getImageUrl(artist.header_image) : null;

    return (
        <div className={styles.container}>
            {/* Шапка с фоном */}
            <div 
                className={styles.header}
                style={headerBg ? { backgroundImage: `url(${headerBg})` } : {}}
            >
                {headerBg && <div className={styles.headerOverlay}></div>}
                <div className={styles.headerContent}>
                    <div className={styles.avatarSection}>
                        <div 
                            className={styles.artistImage}
                            style={{ backgroundImage: `url(${getImageUrl(artist.image)})` }}
                        />
                    </div>
                    <div className={styles.info}>
                        <div className={styles.verified}>
                            <BadgeCheck fill="#3d91f4" color="white" size={24} />
                            Подтвережденный исполнитель
                        </div>
                        <h1 className={styles.name}>{artist.name}</h1>
                        {artist.tags && artist.tags.length > 0 && (
                            <div className={styles.tags}>
                                {artist.tags.map(tag => (
                                    <span key={tag.id} className={styles.tag}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ТОП-6 треков */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ТОП-6 треков исполнителя</h2>
                <div className={styles.topTracksGrid}>
                    {topTracks.map((track, index) => {
                        const isCurrent = activeTrack?.id === track.id;
                        return (
                            <div 
                                key={track.id} 
                                className={`${styles.topTrackCard} ${isCurrent ? styles.activeCard : ''}`}
                                onClick={() => playTrack(track, topTracks, 'playlist')}
                            >
                                <div className={styles.trackNumber}>{index + 1}</div>
                                <div className={styles.topTrackImage}>
                                    {track.album?.cover && (
                                        <div 
                                            style={{ 
                                                backgroundImage: `url(${getImageUrl(track.album.cover)})`,
                                                width: '100%',
                                                height: '100%',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className={styles.topTrackInfo}>
                                    <div className="marqueeWrapper">
                                        <div className={`marqueeContent ${styles.topTrackTitle} ${isCurrent ? styles.activeText : ''}`}>
                                            {track.title}
                                        </div>
                                    </div>
                                    <div className={styles.topTrackDuration}>
                                        {formatTime(track.duration)} •  {track.plays_count} прослушиваний
                                    </div>
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