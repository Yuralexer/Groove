"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Heart, User, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore"; // <--- Импорт
import { useEffect } from "react";
import styles from "./Sidebar.module.css";
import Image from "next/image";
import imgSrc from '../public/Logo.png'

const navigation = [
  { name: "Главная", href: "/", icon: Home },
  { name: "Поиск", href: "/search", icon: Search },
  { name: "Библиотека", href: "/library", icon: Library },
  { name: "Любимое", href: "/collection", icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/">
        <Image
          src={imgSrc}
          alt="Groove Logo"
          height={64}
        />
        </Link>
      </div>

      <nav className={styles.nav}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              <item.icon size={24} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.profile}>
        {isAuthenticated ? (
            <Link href="/account" className={styles.link}>
                <div style={{ background: "#333", borderRadius: "50%", padding: 5 }}>
                    <User size={20} />
                </div>
                {/* Если имя загрузилось - показываем, если нет (токен есть, а запроса профиля еще не было) - "Мой аккаунт" */}
                <span>{user?.username || "Мой аккаунт"}</span>
            </Link>
        ) : (
            // Если НЕ вошли - кнопка на логин
            <Link href="/login" className={styles.link}>
                <div style={{ background: "#333", borderRadius: "50%", padding: 5 }}>
                    <LogIn size={20} />
                </div>
                <span>Войти</span>
            </Link>
        )}
      </div>
    </div>
  );
}