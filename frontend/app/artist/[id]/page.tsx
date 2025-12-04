"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { musicApi, Artist, Track, getImageUrl } from "@/lib/music";
import { usePlayerStore } from "@/store/usePlayerStore";
import { playlistApi } from "@/lib/playlists";
import { formatTime } from "@/lib/utils";
import { BadgeCheck, Heart, MoreVertical, Check } from "lucide-react";
import Marquee from "@/components/Marquee";
import styles from "./artist.module.css";

export default function ArtistPage() {
    const params = useParams();
    const { playTrack, activeTrack } = usePlayerStore();
    
    const [artist, setArtist] = useState<Artist | null>(null);
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Record<number, boolean>>({});
    const [playlistMenuOpen, setPlaylistMenuOpen] = useState<Record<number, boolean>>({});
    const [playlistSubmenuOpen, setPlaylistSubmenuOpen] = useState<Record<number, boolean>>({});
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistMembership, setPlaylistMembership] = useState<Record<number, Record<number, boolean>>>({});
    const menuRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

                // Загружаем избранное
                const pls = await playlistApi.getMyPlaylists();
                const fav = pls.find(p => p.is_favorite);
                if (fav) {
                    const details = await playlistApi.getPlaylist(fav.id);
                    const favObj: Record<number, boolean> = {};
                    details.tracks.forEach((t: any) => {
                        favObj[t.id] = true;
                    });
                    setFavorites(favObj);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [params.id]);

    // Закрыть меню при клике вне
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node;
            const isClickedInside = Object.values(menuRefs.current).some(ref => ref?.contains(target));
            
            if (!isClickedInside) {
                setPlaylistMenuOpen({});
                setPlaylistSubmenuOpen({});
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (!artist) return <div className="p-8">Артист не найден</div>;

    const headerBg = artist.header_image ? getImageUrl(artist.header_image) : null;

    const toggleFavorite = async (trackId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const isFav = !!favorites[trackId];
            if (!isFav) {
                await playlistApi.addToFavorite(trackId);
            } else {
                await playlistApi.removeFromFavorite(trackId);
            }
            setFavorites(prev => ({ ...prev, [trackId]: !isFav }));
        } catch (err) {
            console.error(err);
        }
    };

    const openPlaylistSubmenu = async (trackId: number) => {
        setPlaylistSubmenuOpen(prev => ({ ...prev, [trackId]: true }));
        try {
            const pls = await playlistApi.getMyPlaylists();
            setPlaylists(pls);
            const detailsPromises = pls.map(p => playlistApi.getPlaylist(p.id).catch(() => null));
            const details = await Promise.all(detailsPromises);
            const membership: Record<number, boolean> = {};
            details.forEach((d, idx) => {
                if (!d) return;
                membership[pls[idx].id] = d.tracks.some((t: any) => t.id === trackId);
            });
            setPlaylistMembership(prev => ({ ...prev, [trackId]: membership }));
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTrackInPlaylist = async (trackId: number, playlistId: number) => {
        try {
            const isIn = !!playlistMembership[trackId]?.[playlistId];
            if (!isIn) {
                await playlistApi.addTrack(playlistId, trackId);
            } else {
                await playlistApi.removeTrack(playlistId, trackId);
            }
            setPlaylistMembership(prev => ({
                ...prev,
                [trackId]: { ...prev[trackId], [playlistId]: !isIn }
            }));
        } catch (e) {
            console.error(e);
        }
    };

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
                        const isFav = !!favorites[track.id];
                        return (
                            <div 
                                key={track.id} 
                                className={`${styles.topTrackCard} ${isCurrent ? styles.activeCard : ''}`}
                                onClick={() => playTrack(track, topTracks, 'playlist')}
                                ref={(el) => { menuRefs.current[track.id] = el; }}
                            >
                                <div className={styles.trackNumber}>{index + 1}</div>
                                <div className={styles.topTrackImage}>
                                    {track.cover && (
                                        <div 
                                            style={{ 
                                                backgroundImage: `url(${getImageUrl(track.cover)})`,
                                                width: '100%',
                                                height: '100%',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className={styles.topTrackInfo}>
                                    <Marquee className={styles.topTrackTitle}>
                                        <div className={isCurrent ? styles.activeText : ''}>
                                            {track.title}
                                        </div>
                                    </Marquee>
                                    <div className={styles.topTrackDuration}>
                                        {formatTime(track.duration)} •  {track.plays_count} прослушиваний
                                    </div>
                                </div>
                                {/* Кнопки лайка и меню */}
                                <div className={styles.topTrackActions} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        className={styles.actionButton} 
                                        onClick={(e) => toggleFavorite(track.id, e)}
                                        aria-label="Like"
                                    >
                                        <Heart size={18} fill={isFav ? 'currentColor' : 'none'} color={isFav ? '#ff5555' : 'currentColor'} />
                                    </button>

                                    <div className={styles.menuWrapper}>
                                        <button 
                                            className={styles.actionButton} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPlaylistMenuOpen(prev => ({ ...prev, [track.id]: !prev[track.id] }));
                                                if (!playlistMenuOpen[track.id]) {
                                                    setPlaylistSubmenuOpen(prev => ({ ...prev, [track.id]: false }));
                                                }
                                            }}
                                            aria-label="More"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {playlistMenuOpen[track.id] && (
                                            <div className={styles.menu}>
                                                <div 
                                                    className={styles.menuItem} 
                                                    onMouseEnter={() => openPlaylistSubmenu(track.id)}
                                                >
                                                    <div>Добавить в плейлист</div>
                                                    <div className={styles.submenuArrow}>▶</div>
                                                    {playlistSubmenuOpen[track.id] && (
                                                        <div className={styles.submenu}>
                                                            {playlists.length === 0 && <div className={styles.menuItem}>Нет плейлистов</div>}
                                                            {playlists.map(p => (
                                                                <div 
                                                                    key={p.id} 
                                                                    className={styles.menuItem} 
                                                                    onClick={() => toggleTrackInPlaylist(track.id, p.id)}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <div style={{ width: 8 }}>
                                                                            {playlistMembership[track.id]?.[p.id] ? <Check size={14} /> : null}
                                                                        </div>
                                                                        <div>{p.title}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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