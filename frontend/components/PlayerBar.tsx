"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getImageUrl } from "@/lib/music";
import { formatTime } from "@/lib/utils";
import { playlistApi } from "@/lib/playlists";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, MoreVertical, Check } from "lucide-react";
import styles from "./PlayerBar.module.css";

export default function PlayerBar() {
    const { activeTrack, isPlaying, togglePlay, setIsPlaying, playNext, playPrevious, canPlayNext, canPlayPrevious } = usePlayerStore();
    const audioRef = useRef<HTMLAudioElement>(null);

    // Локальные состояния для UI
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(0.5); // Чтобы вернуть громкость после Unmute
    const [isFavorite, setIsFavorite] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistMembership, setPlaylistMembership] = useState<Record<number, boolean>>({});
    const menuRef = useRef<HTMLDivElement | null>(null);

    // 1. Управление воспроизведением (как было)
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Play error:", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, activeTrack]);

    // 2. Автозапуск (как было) + Сброс времени
    useEffect(() => {
        if (activeTrack && audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.currentTime = 0; // Сброс времени
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, [activeTrack]);

    // 3. Обновление времени (progress bar)
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    // Load favorite status
    useEffect(() => {
        if (!activeTrack) return;
        let mounted = true;
        const loadFav = async () => {
            try {
                const pls = await playlistApi.getMyPlaylists();
                const fav = pls.find(p => p.is_favorite);
                if (!fav) { if (mounted) setIsFavorite(false); return; }
                const details = await playlistApi.getPlaylist(fav.id);
                const contains = details.tracks.some((t: any) => t.id === activeTrack.id);
                if (mounted) setIsFavorite(contains);
            } catch (e) {
                console.error(e);
            }
        };
        loadFav();
        return () => { mounted = false; }
    }, [activeTrack]);

    // Close menu on outside click
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

    const handleTrackEnd = () => {
        if (canPlayNext()) {
            playNext();
        } else {
            setIsPlaying(false);
        }
    };

    // 4. Перемотка (Seek)
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // 5. Громкость
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = Number(e.target.value);
        setVolume(newVol);
        setIsMuted(newVol === 0);
        if (audioRef.current) audioRef.current.volume = newVol;
    };

    const toggleMute = () => {
        if (audioRef.current) {
            if (isMuted) {
                // Включаем звук обратно
                setVolume(prevVolume);
                audioRef.current.volume = prevVolume;
                setIsMuted(false);
            } else {
                // Выключаем
                setPrevVolume(volume);
                setVolume(0);
                audioRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeTrack) return;
        try {
            if (!isFavorite) {
                await playlistApi.addToFavorite(activeTrack.id);
                setIsFavorite(true);
            } else {
                await playlistApi.removeFromFavorite(activeTrack.id);
                setIsFavorite(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openPlaylistSubmenu = async () => {
        if (!activeTrack) return;
        setSubmenuOpen(true);
        try {
            const pls = await playlistApi.getMyPlaylists();
            setPlaylists(pls);
            const detailsPromises = pls.map(p => playlistApi.getPlaylist(p.id).catch(() => null));
            const details = await Promise.all(detailsPromises);
            const membership: Record<number, boolean> = {};
            details.forEach((d, idx) => {
                if (!d) return;
                membership[pls[idx].id] = d.tracks.some((t: any) => t.id === activeTrack.id);
            });
            setPlaylistMembership(membership);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTrackInPlaylist = async (playlistId: number) => {
        if (!activeTrack) return;
        try {
            const isIn = !!playlistMembership[playlistId];
            if (!isIn) {
                await playlistApi.addTrack(playlistId, activeTrack.id);
            } else {
                await playlistApi.removeTrack(playlistId, activeTrack.id);
            }
            setPlaylistMembership(prev => ({ ...prev, [playlistId]: !isIn }));
        } catch (e) {
            console.error(e);
        }
    };

    if (!activeTrack) return null; 

    // Вычисляем процент заполнения прогресс-бара
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={styles.player}>
            <audio 
                ref={audioRef} 
                src={getImageUrl(activeTrack.file)} 
                onEnded={handleTrackEnd}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
            />

            {/* --- ПРОГРЕСС БАР (Сверху) --- */}
            <div className={styles.progressBarContainer}>
                {/* Визуальная полоска */}
                <div 
                    className={styles.progressBarFill} 
                    style={{ width: `${progressPercent}%` }}
                ></div>
                {/* Невидимый ползунок для управления */}
                <input 
                    type="range" 
                    min={0} 
                    max={duration} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className={styles.seekInput}
                />
            </div>


            {/* Инфо */}
            <div className={styles.trackInfo}>
                <div 
                    className={styles.cover} 
                    style={{ backgroundImage: `url(${getImageUrl(activeTrack.cover || null)})` }}
                />
                <div>
                    <div style={{ fontWeight: 600 }}>{activeTrack.title}</div>
                    <div style={{ fontSize: 12, color: '#b3b3b3' }}>{activeTrack.artist || "Неизвестен"}</div>
                </div>
            </div>

            {/* Кнопки */}
            <div className={styles.controls}>
                <div className={styles.buttons}>
                    <button 
                        className={`${styles.iconButton} ${!canPlayPrevious() ? styles.disabled : ''}`}
                        onClick={() => canPlayPrevious() && playPrevious()}
                        disabled={!canPlayPrevious()}
                    >
                        <SkipBack size={20} />
                    </button>
                    
                    <button className={styles.playButton} onClick={togglePlay}>
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" ml={2} />}
                    </button>
                    
                    <button 
                        className={`${styles.iconButton} ${!canPlayNext() ? styles.disabled : ''}`}
                        onClick={() => canPlayNext() && playNext()}
                        disabled={!canPlayNext()}
                    >
                        <SkipForward size={20} />
                    </button>
                </div>
                {/* Время (текущее / всего) */}
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* --- ГРОМКОСТЬ --- */}
            <div className={styles.volumeContainer}>
                <div className={styles.volumeWrapper}>
                    {/* Like and Menu buttons */}
                    <div className={styles.trackActions} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.actionButton} onClick={toggleFavorite} aria-label="Like">
                            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? styles.liked : ''} />
                        </button>

                        <div className={styles.menuWrapper} ref={menuRef}>
                            <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); if (!menuOpen) setSubmenuOpen(false); }} aria-label="More">
                                <MoreVertical size={18} />
                            </button>

                            {menuOpen && (
                                <div className={styles.menu}>
                                    <div className={styles.menuItem} onMouseEnter={openPlaylistSubmenu}>
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
                    </div>

                    <div className={styles.volumeSlider}>
                         <input 
                            type="range" 
                            min={0} 
                            max={1} 
                            step={0.01}
                            value={volume} 
                            onChange={handleVolumeChange}
                            className={styles.rangeInput}
                            style={{ backgroundSize: `${volume * 100}% 100%` }}
                        />
                    </div>
                    <button className={styles.iconButton} onClick={toggleMute}>
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}