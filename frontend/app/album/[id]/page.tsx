"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { musicApi, getImageUrl } from "@/lib/music";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { Play } from "lucide-react";
import Marquee from "@/components/Marquee";
import TrackRow from "@/components/TrackRow";
import styles from "./album.module.css";

interface AlbumDetail {
    id: number;
    title: string;
    artist: {
        id: number;
        name: string;
        image: string;
    };
    cover: string;
    release_date: string;
    tracks: {
        id: number;
        title: string;
        file: string;
        duration: number;
        plays_count: number;
        cover?: string;
        artist?: string;
        artist_id?: number;
        artist_image?: string;
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
        const t = {
            ...track,
            cover: album.cover,
            artist: track.artist || (album.artist && album.artist.name),
            artist_id: track.artist_id ?? (album.artist && album.artist.id),
            artist_image: track.artist_image ?? (album.artist && album.artist.image),
            artists: [],
        } as any;

        // Build queue with album tracks enriched with cover/artist
        const queue = album.tracks.map(tr => ({
            ...tr,
            cover: album.cover,
            artist: tr.artist || (album.artist && album.artist.name),
            artist_id: tr.artist_id ?? (album.artist && album.artist.id),
            artist_image: tr.artist_image ?? (album.artist && album.artist.image),
            artists: [],
        }));
        playTrack(t, queue, 'album');
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
                    <Marquee style={{ maxWidth: '70vw' }}>
                        <h1 className={styles.title}>
                            {album.title}
                        </h1>
                    </Marquee>
                    <div className={styles.meta}>
                        {/* Artist avatar + link */}
                        {album.artist ? (
                            <>
                                <Link href={`/artist/${album.artist.id}`} className={styles.artistLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundImage: `url(${getImageUrl(album.artist.image)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    <span style={{ fontWeight: 'bold' }}>{album.artist.name}</span>
                                </Link>
                                <span>• {album.release_date?.split('-')[0]}</span>
                                <span>• {album.tracks.length} треков</span>
                            </>
                        ) : (
                            <>
                                <div style={{width: 24, height: 24, borderRadius: '50%', background: '#777'}}></div>
                                <span style={{fontWeight: 'bold'}}>{album.artist}</span>
                                <span>• {album.release_date?.split('-')[0]}</span>
                                <span>• {album.tracks.length} треков</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Список треков */}
            <div className={styles.trackList}>
                {album.tracks.map((track) => {
                    // Обогащаем трек данными альбома
                    const enrichedTrack = {
                        ...track,
                        cover: album.cover,
                        artist: track.artist || (album.artist && album.artist.name),
                        artist_id: track.artist_id ?? (album.artist && album.artist.id),
                        artist_image: track.artist_image ?? (album.artist && album.artist.image),
                        artists: [],
                    } as any;

                    return (
                        <TrackRow 
                            key={track.id} 
                            track={enrichedTrack} 
                            queue={album.tracks.map(tr => ({
                                ...tr,
                                cover: album.cover,
                                artist: tr.artist || (album.artist && album.artist.name),
                                artist_id: tr.artist_id ?? (album.artist && album.artist.id),
                                artist_image: tr.artist_image ?? (album.artist && album.artist.image),
                                artists: [],
                            })) as any}
                            context="album" 
                            showCover={false}
                        />
                    );
                })}
            </div>
        </div>
    );
}