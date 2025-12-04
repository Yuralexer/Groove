"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { musicApi, Album, getImageUrl } from "@/lib/music";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import Marquee from "@/components/Marquee";

export default function Home() {
  const { user } = useAuthStore(); // Берем имя юзера
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем альбомы
        const data = await musicApi.getAllAlbums();
        setAlbums(data);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
            {/* Если юзер загрузился - пишем имя, иначе просто привет */}
            Добрый день{user?.username ? `, ${user.username}` : ""}!
        </h1>
      </div>

      <section>
        <h2 className={styles.sectionTitle}>Новые релизы</h2>
        
        {loading ? (
            <div>Загрузка...</div>
        ) : (
            <div className={styles.grid}>
            {albums.map((album) => (
                <Link href={`/album/${album.id}`} key={album.id} className={styles.card}>
                  {/* Картинка */}
                  <div 
                      className={styles.cardImage} 
                      style={{ backgroundImage: `url(${getImageUrl(album.cover)})` }} 
                  />
                  
                  {/* Текстовая часть */}
                  <div className={styles.cardContent}>
                      {/* Название с прокруткой */}
                      <Marquee className={styles.cardTitle}>
                          {album.title}
                      </Marquee>
                      
                      {/* Артист */}
                      <div style={{ fontSize: 14, color: '#b3b3b3', marginTop: 4 }}>
                          {album.artist}
                      </div>
                  </div>
              </Link>
            ))}
            </div>
        )}
      </section>
    </div>
  );
}