"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { User as UserIcon, LogOut, Key, Save } from "lucide-react";
import styles from "./account.module.css";

export default function AccountPage() {
    const { user, logout, isAuthenticated, checkAuth, authChecked } = useAuthStore();
    const router = useRouter();

    // Состояния форм
    const [newUsername, setNewUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Сообщения
    const [profileMsg, setProfileMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
    const [passMsg, setPassMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        // Ensure we run the auth check on mount. The redirect to /login
        // should only happen after the initial auth check completes (authChecked)
        // to avoid brief false-redirects on page reload.
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // After initial auth check finished, redirect if not authenticated.
        if (authChecked && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated && user) setNewUsername(user.username || "");
    }, [authChecked, isAuthenticated, user, router]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        try {
            await api.patch('/auth/update-profile/', { username: newUsername });
            setProfileMsg({ type: 'success', text: 'Имя пользователя обновлено!' });
            checkAuth(); // Обновляем данные в стейте (в сайдбаре тоже обновится)
        } catch (err) {
            setProfileMsg({ type: 'error', text: 'Ошибка обновления профиля.' });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg(null);
        try {
            await api.post('/auth/change-password/', { 
                old_password: oldPassword,
                new_password: newPassword 
            });
            setPassMsg({ type: 'success', text: 'Пароль успешно изменен!' });
            setOldPassword("");
            setNewPassword("");
        } catch (err: any) {
            // Пытаемся достать текст ошибки от бэка
            const errorText = err.response?.data?.old_password?.[0] || 'Ошибка смены пароля.';
            setPassMsg({ type: 'error', text: errorText });
        }
    };

    if (!user) return null;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Настройки аккаунта</h1>

            <div className={styles.grid}>
                
                {/* Левая колонка: Инфо + Выход */}
                <div className={styles.profileCard}>
                    <div className={styles.avatar}>
                        <UserIcon size={60} color="#aaa" />
                    </div>
                    <div className={styles.usernameDisplay}>{user.username}</div>
                    <div className={styles.emailDisplay}>{user.email}</div>

                    <button onClick={handleLogout} className={`${styles.btn} ${styles.btnDanger}`}>
                        <LogOut size={18} /> Выйти
                    </button>
                    {(user as any)?.is_superuser && (
                        <a href="/admin" className={`${styles.btn} ${styles.btnPrimary}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Админка
                        </a>
                    )}
                </div>

                {/* Правая колонка: Формы */}
                <div className={styles.settingsColumn}>
                    
                    {/* Форма 1: Изменить имя */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Данные профиля</h2>
                        {profileMsg && (
                            <div className={`${styles.message} ${profileMsg.type === 'success' ? styles.success : styles.error}`}>
                                {profileMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleUpdateProfile}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Имя пользователя</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    value={newUsername || ""}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                />
                            </div>
                            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                                <div style={{display:'flex', alignItems:'center', gap: 8}}>
                                    <Save size={16}/> Сохранить
                                </div>
                            </button>
                        </form>
                    </section>

                    {/* Форма 2: Изменить пароль */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Безопасность</h2>
                        {passMsg && (
                            <div className={`${styles.message} ${passMsg.type === 'success' ? styles.success : styles.error}`}>
                                {passMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Текущий пароль</label>
                                <input 
                                    type="password" 
                                    className={styles.input}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Новый пароль</label>
                                <input 
                                    type="password" 
                                    className={styles.input}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                                <div style={{display:'flex', alignItems:'center', gap: 8}}>
                                    <Key size={16}/> Обновить пароль
                                </div>
                            </button>
                        </form>
                    </section>

                </div>
            </div>
        </div>
    );
}