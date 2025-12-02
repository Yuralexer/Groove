"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { playlistApi, Playlist } from "@/lib/playlists";
import CreatePlaylistMenu from "./CreatePlaylistMenu";
import { getImageUrl } from "@/lib/music";
import { Heart, Music } from "lucide-react";
import styles from "./library.module.css"; // Стиль создадим ниже

export default function LibraryPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        playlistApi.getMyPlaylists()
            .then(setPlaylists)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Загрузка...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Моя медиатека</h1>
                <CreatePlaylistMenu onCreated={async () => {
                    setLoading(true);
                    try {
                        const pls = await playlistApi.getMyPlaylists();
                        setPlaylists(pls);
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setLoading(false);
                    }
                }} />
            </div>

            <div className={styles.grid}>
                {/* Специальная карточка для "Любимых треков", если мы хотим её дублировать тут */}
                {/* Но обычно мы рендерим то, что пришло с бэка. 
                    "Любимое" уже должно быть в массиве playlists */}
                
                {playlists.map(playlist => {
                    // Если это "Любимое", ссылка ведет на спец. страницу, иначе на обычную
                    const href = playlist.is_favorite 
                        ? "/collection/" 
                        : `/playlist/${playlist.id}`;

                    return (
                        <Link href={href} key={playlist.id} className={styles.card}>
                            <div className={`${styles.imagePlaceholder} ${playlist.is_favorite ? styles.favoriteBg : ''}`}>
                                {playlist.cover ? (
                                    <div 
                                        className={styles.cover} 
                                        style={{ backgroundImage: `url(${getImageUrl(playlist.cover)})` }} 
                                    />
                                ) : (
                                    // Иконка если обложки нет
                                    playlist.is_favorite ? <Heart fill="white" size={40} /> : <Music size={40} />
                                )}
                            </div>
                            <div className={styles.cardTitle}>{playlist.title}</div>
                            <div className={styles.cardOwner}>Плейлист</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}