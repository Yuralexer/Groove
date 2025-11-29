"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getImageUrl } from "@/lib/music";
import { formatTime } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import styles from "./PlayerBar.module.css";

export default function PlayerBar() {
    const { activeTrack, isPlaying, togglePlay, setIsPlaying } = usePlayerStore();
    const audioRef = useRef<HTMLAudioElement>(null);

    // Локальные состояния для UI
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(0.5); // Чтобы вернуть громкость после Unmute

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

    if (!activeTrack) return null; 

    // Вычисляем процент заполнения прогресс-бара
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={styles.player}>
            <audio 
                ref={audioRef} 
                src={getImageUrl(activeTrack.file)} 
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate} // Важно! Слушаем время
                onLoadedMetadata={handleTimeUpdate} // Когда файл загрузился, узнаем длительность
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
                    <button className={styles.iconButton}><SkipBack size={20} /></button>
                    
                    <button className={styles.playButton} onClick={togglePlay}>
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" ml={2} />}
                    </button>
                    
                    <button className={styles.iconButton}><SkipForward size={20} /></button>
                </div>
                {/* Время (текущее / всего) */}
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* --- ГРОМКОСТЬ --- */}
            <div className={styles.volumeContainer}>
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