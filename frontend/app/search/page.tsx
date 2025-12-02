"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { musicApi, Track, Album, Artist, getImageUrl } from "@/lib/music";
import TrackRow from "@/components/TrackRow";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import styles from "./search.module.css";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    
    // Результаты
    const [tracks, setTracks] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    
    const { playTrack, activeTrack } = usePlayerStore();

    useEffect(() => {
        // Если запрос пустой - чистим результаты
        if (!query.trim()) {
            setTracks([]);
            setAlbums([]);
            setArtists([]);
            return;
        }

        // DEBOUNCE: Ждем 500мс после ввода
        const timeoutId = setTimeout(async () => {
            try {
                // Запускаем 3 запроса параллельно
                const [tracksData, albumsData, artistsData] = await Promise.all([
                    musicApi.searchTracks(query),
                    musicApi.searchAlbums(query),
                    musicApi.searchArtists(query)
                ]);
                
                setTracks(tracksData);
                setAlbums(albumsData);
                setArtists(artistsData);
            } catch (e) {
                console.error(e);
            }
        }, 500);

        // Очистка таймера, если юзер снова нажал кнопку до истечения 500мс
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className={styles.container}>
            {/* Поле ввода */}
            <div className={styles.searchBarWrapper}>
                <SearchIcon color="#333" size={24} />
                <input 
                    type="text" 
                    className={styles.searchInput}
                    placeholder="Что хотите послушать?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Если ничего не введено */}
            {!query && (
                <div className={styles.placeholder}>
                    <h2>Найдите любимую музыку</h2>
                    <p>Введите название трека, альбома или исполнителя</p>
                </div>
            )}

            {/* Результаты */}
            {query && (
                <div className={styles.results}>
                    
                    {/* Секция: Артисты */}
                    {artists.length > 0 && (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Исполнители</h3>
                            <div className={styles.artistGrid}>
                                {artists.map(artist => (
                                    // Ссылка на страницу артиста (сделаем позже)
                                    <Link href={`/artist/${artist.id}`} key={artist.id} className={styles.artistCard}>
                                        <div 
                                            className={styles.artistImage}
                                            style={{ backgroundImage: `url(${getImageUrl(artist.image)})` }}
                                        />
                                        <div className={styles.artistName}>{artist.name}</div>
                                        <div className={styles.artistLabel}>Исполнитель</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Секция: Альбомы */}
                    {albums.length > 0 && (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Альбомы</h3>
                            <div className={styles.albumGrid}>
                                {albums.map(album => (
                                    <Link href={`/album/${album.id}`} key={album.id} className={styles.albumCard}>
                                        <div 
                                            className={styles.albumImage}
                                            style={{ backgroundImage: `url(${getImageUrl(album.cover)})` }}
                                        />
                                        <div className={styles.albumTitle}>{album.title}</div>
                                        <div className={styles.albumArtist}>{album.artist}</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Секция: Треки */}
                    {tracks.map(track => {
                        return (
                            <div key={track.id}>
                                {/* Using reusable TrackRow component */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <TrackRow track={track} queue={tracks} context="search" />
                            </div>
                        )
                    })}
                    
                    {/* Если ввели, но ничего не нашли */}
                    {artists.length === 0 && albums.length === 0 && tracks.length === 0 && (
                        <div className={styles.noResults}>Ничего не найдено по запросу "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
}