"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getImageUrl } from "@/lib/music";
import { formatTime } from "@/lib/utils";
import { playlistApi } from "@/lib/playlists";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, MoreVertical, Check, Shuffle, Repeat, Repeat1 } from "lucide-react";
import Link from "next/link";
import styles from "./PlayerBar.module.css";

// Константы для громкости
const VOLUME_MIN = 0;
const VOLUME_MAX = 1;
const VOLUME_DEFAULT = 1;
const VOLUME_COOKIE_NAME = 'groove_volume';

const loadVolumeFromCookie = (): number => {
    if (typeof window === 'undefined') return VOLUME_DEFAULT;
    
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${VOLUME_COOKIE_NAME}=`));
    
    if (!cookie) return VOLUME_DEFAULT;
    
    try {
        const volumeStr = cookie.split('=')[1];
        const volume = parseFloat(volumeStr);
        
        // Валидация: если значение вне границ, используем границу
        if (isNaN(volume)) return VOLUME_DEFAULT;
        if (volume < VOLUME_MIN) return VOLUME_MIN;
        if (volume > VOLUME_MAX) return VOLUME_MAX;
        
        return volume;
    } catch {
        return VOLUME_DEFAULT;
    }
};

// Функция для сохранения громкости в куки
const saveVolumeToCookie = (volume: number): void => {
    if (typeof window === 'undefined') return;
    
    // Валидируем перед сохранением
    let validVolume = volume;
    if (validVolume < VOLUME_MIN) validVolume = VOLUME_MIN;
    if (validVolume > VOLUME_MAX) validVolume = VOLUME_MAX;
    
    // Устанавливаем куку на год
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${VOLUME_COOKIE_NAME}=${validVolume}; expires=${expiryDate.toUTCString()}; path=/`;
};

export default function PlayerBar() {
    const { activeTrack, isPlaying, togglePlay, setIsPlaying, playNext, playPrevious, canPlayNext, canPlayPrevious, loopMode, cycleLoopMode, isShuffleEnabled, toggleShuffle } = usePlayerStore();
    const audioRef = useRef<HTMLAudioElement>(null);

    // Локальные состояния для UI
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(VOLUME_DEFAULT);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(0.5); // Чтобы вернуть громкость после Unmute
    const [isFavorite, setIsFavorite] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistMembership, setPlaylistMembership] = useState<Record<number, boolean>>({});
    const menuRef = useRef<HTMLDivElement | null>(null);
    const isSeeking = useRef(false); // Флаг для отслеживания перемотки

    // Инициализация громкости из куки при загрузке компонента
    useEffect(() => {
        const savedVolume = loadVolumeFromCookie();
        setVolume(savedVolume);
        if (audioRef.current) {
            audioRef.current.volume = savedVolume;
        }
    }, []);

    // Инициализация Media Session API для управления с наушников
    useEffect(() => {
        if (!('mediaSession' in navigator) || !activeTrack) return;

        const media = navigator.mediaSession;
        
        // Обновляем информацию о текущей песне
        media.metadata = new MediaMetadata({
            title: activeTrack.title,
            artist: activeTrack.artist || 'Неизвестен',
            album: typeof activeTrack.album === 'string' ? activeTrack.album : (typeof activeTrack.album === 'object' && activeTrack.album?.title ? activeTrack.album.title : ''),
            artwork: activeTrack.cover ? [
                { src: getImageUrl(activeTrack.cover), sizes: '96x96', type: 'image/jpeg' }
            ] : []
        });

        // Устанавливаем обработчики
        media.setActionHandler('play', () => togglePlay());
        media.setActionHandler('pause', () => togglePlay());
        media.setActionHandler('nexttrack', () => {
            if (canPlayNext()) {
                playNext();
            }
        });
        media.setActionHandler('previoustrack', () => {
            if (canPlayPrevious()) {
                playPrevious();
            }
        });

        // Чистка: удаляем обработчики при размонтировании или изменении трека
        return () => {
            media.setActionHandler('play', null);
            media.setActionHandler('pause', null);
            media.setActionHandler('nexttrack', null);
            media.setActionHandler('previoustrack', null);
        };
    }, [activeTrack, togglePlay, playNext, playPrevious, canPlayNext, canPlayPrevious]);

    // 1. Управление воспроизведением (как было)
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Play error:", e));
        } else {
            audioRef.current.pause();
        }
        
        // Обновляем состояние в Media Session API
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    // 2. Автозапуск (как было) + Сброс времени
    useEffect(() => {
        if (activeTrack && audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.currentTime = 0; // Сброс времени
            isSeeking.current = false; // Сбрасываем флаг при смене трека
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
            isSeeking.current = true;
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
        // Сохраняем громкость в куки
        saveVolumeToCookie(newVol);
    };

    const toggleMute = () => {
        if (audioRef.current) {
            if (isMuted) {
                // Включаем звук обратно
                setVolume(prevVolume);
                audioRef.current.volume = prevVolume;
                setIsMuted(false);
                saveVolumeToCookie(prevVolume);
            } else {
                // Выключаем
                setPrevVolume(volume);
                setVolume(0);
                audioRef.current.volume = 0;
                setIsMuted(true);
                saveVolumeToCookie(0);
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
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/music/tracks/${activeTrack.id}/stream/`} 
                onEnded={handleTrackEnd}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onSeeking={() => { isSeeking.current = true; }}
                onSeeked={() => { isSeeking.current = false; }}
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
                    <div style={{ fontSize: 12, color: '#b3b3b3', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {activeTrack.artist_id ? (
                                <Link href={`/artist/${activeTrack.artist_id}`} className={styles.artistLink}>
                                    {activeTrack.artist}
                                </Link>
                            ) : (
                                activeTrack.artist || 'Неизвестен'
                            )}
                    </div>
                </div>
            </div>

            {/* Кнопки */}
            <div className={styles.controls}>
                <div className={styles.buttonRow}>
                    {/* Кнопка рандомизации - слева */}
                    <button 
                        className={`${styles.iconButton} ${isShuffleEnabled ? styles.active : ''}`}
                        onClick={toggleShuffle}
                        title={isShuffleEnabled ? "Рандомизация включена" : "Рандомизация выключена"}
                    >
                        <Shuffle size={20} />
                    </button>

                    {/* Кнопка предыдущего трека */}
                    <button 
                        className={`${styles.iconButton} ${!canPlayPrevious() ? styles.disabled : ''}`}
                        onClick={() => canPlayPrevious() && playPrevious()}
                        disabled={!canPlayPrevious()}
                    >
                        <SkipBack size={20} />
                    </button>
                    
                    {/* Кнопка play/pause */}
                    <button className={styles.playButton} onClick={togglePlay}>
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
                    </button>
                    
                    {/* Кнопка следующего трека */}
                    <button 
                        className={`${styles.iconButton} ${!canPlayNext() ? styles.disabled : ''}`}
                        onClick={() => canPlayNext() && playNext()}
                        disabled={!canPlayNext()}
                    >
                        <SkipForward size={20} />
                    </button>

                    {/* Кнопка зацикливания - справа */}
                    <button 
                        className={`${styles.iconButton} ${loopMode !== 'no-repeat' ? styles.active : ''}`}
                        onClick={cycleLoopMode}
                        title={
                            loopMode === 'no-repeat' ? 'Нет зацикливания' :
                            loopMode === 'repeat-playlist' ? 'Плейлист/Альбом зациклен' :
                            'Песня зациклена'
                        }
                    >
                        {loopMode === 'repeat-track' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                </div>
                {/* Время (текущее / всего) */}
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* --- ГРОМКОСТЬ --- */}
            <div className={styles.volumeContainer}>
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
                <div className={styles.volumeWrapper}>
                    <div className={styles.volumeSlider}>
                         <input 
                            type="range" 
                            min={0} 
                            max={1} 
                            step={0.01}
                            value={volume} 
                            onChange={handleVolumeChange}
                            className={styles.rangeInput}
                            style={{ "--value": `${volume * 100}%` } as React.CSSProperties}
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