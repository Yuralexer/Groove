"use client";

import { useEffect, useState, useRef } from "react";
import { Track } from "@/lib/music";
import { getImageUrl } from "@/lib/music";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { playlistApi } from "@/lib/playlists";
import styles from "./trackrow.module.css";
import { Heart, MoreVertical, Check } from "lucide-react";
import Marquee from "@/components/Marquee"

export default function TrackRow({ track, queue, context, showCover = false, showArtistInfo = true }: { track: Track; queue?: Track[]; context?: 'album' | 'playlist' | 'search'; showCover?: boolean; showArtistInfo?: boolean }) {
    const { playTrack, activeTrack } = usePlayerStore();
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistMembership, setPlaylistMembership] = useState<Record<number, boolean>>({});
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // check whether track is in favorite playlist
        let mounted = true;
        const loadFav = async () => {
            try {
                const pls = await playlistApi.getMyPlaylists();
                const fav = pls.find(p => p.is_favorite);
                if (!fav) { if (mounted) setIsFavorite(false); return; }
                const details = await playlistApi.getPlaylist(fav.id);
                const contains = details.tracks.some((t: any) => t.id === track.id);
                if (mounted) setIsFavorite(contains);
            } catch (e) {
                console.error(e);
            }
        };
        loadFav();
        return () => { mounted = false; }
    }, [track.id]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setSubmenuOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [menuOpen]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (!isFavorite) {
                await playlistApi.addToFavorite(track.id);
                setIsFavorite(true);
            } else {
                await playlistApi.removeFromFavorite(track.id);
                setIsFavorite(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openPlaylistSubmenu = async () => {
        setSubmenuOpen(true);
        try {
            const pls = await playlistApi.getMyPlaylists();
            setPlaylists(pls);
            // fetch details in parallel to determine membership
            const detailsPromises = pls.map(p => playlistApi.getPlaylist(p.id).catch(() => null));
            const details = await Promise.all(detailsPromises);
            const membership: Record<number, boolean> = {};
            details.forEach((d, idx) => {
                if (!d) return;
                membership[pls[idx].id] = d.tracks.some((t: any) => t.id === track.id);
            });
            setPlaylistMembership(membership);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTrackInPlaylist = async (playlistId: number) => {
        try {
            const isIn = !!playlistMembership[playlistId];
            if (!isIn) {
                await playlistApi.addTrack(playlistId, track.id);
            } else {
                await playlistApi.removeTrack(playlistId, track.id);
            }
            setPlaylistMembership(prev => ({ ...prev, [playlistId]: !isIn }));
        } catch (e) {
            console.error(e);
        }
    };

    const onPlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        playTrack(track, queue, context);
    };

    const isCurrent = activeTrack?.id === track.id;

    return (
        <div className={styles.row} onClick={() => playTrack(track, queue, context)}>
            <div className={styles.num}>{isCurrent ? '▶' : ''}</div>
            <div className={styles.trackView}>
                {showCover && (
                    <div className={styles.image} style={{ backgroundImage: track.cover ? `url(${getImageUrl(track.cover)})` : undefined }}>
                        {!track.cover && '♫'}
                    </div>
                )}

                <div className={styles.info}>
                    <div className={`${styles.title} ${isCurrent ? styles.activeText : ''}`}>
                        <Marquee>
                            {track.title}
                        </Marquee>
                    </div>
                    {showArtistInfo && (
                        <div className={styles.artist}>
                            {track.artist_id ? (
                                <Link href={`/artist/${track.artist_id}`} className={styles.artistLink} onClick={(e) => e.stopPropagation()}>
                                    <span>{track.artist}</span>
                                </Link>
                            ) : (
                                track.artist || 'Неизвестный'
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button className={styles.iconButton} onClick={toggleFavorite} aria-label="Like">
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? styles.liked : ''} />
                </button>

                <div className={styles.menuWrapper} ref={menuRef}>
                    <button className={styles.iconButton} onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); if (!menuOpen) setSubmenuOpen(false); }} aria-label="More">
                        <MoreVertical size={18} />
                    </button>

                    {menuOpen && (
                        <div className={styles.menu}>
                            <div className={styles.menuItem} onMouseEnter={openPlaylistSubmenu} onMouseLeave={() => { /* keep submenu open until clicked away */ }}>
                                <div>Добавить в плейлист</div>
                                <div className={styles.submenuArrow}>▶</div>
                                {submenuOpen && (
                                    <div className={styles.submenu}>
                                        {playlists.length === 0 && <div className={styles.menuItem}>Нет плейлистов</div>}
                                        {playlists.map(p => (
                                            <div key={p.id} className={styles.menuItem} onClick={() => toggleTrackInPlaylist(p.id)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8 }}>
                                                        {playlistMembership[p.id] ? <Check size={14} /> : null}
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

                <div className={styles.time}>{/* placeholder for duration */}</div>
            </div>
        </div>
    );
}
