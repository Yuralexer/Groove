"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./register.module.css";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const register = useAuthStore((state) => state.register);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Валидация
        if (!username.trim()) {
            setError("Имя пользователя не может быть пустым");
            setLoading(false);
            return;
        }

        if (username.length < 3) {
            setError("Имя пользователя должно быть не менее 3 символов");
            setLoading(false);
            return;
        }

        if (!email.includes("@")) {
            setError("Введите корректный email");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Пароль должен быть не менее 6 символов");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            setLoading(false);
            return;
        }

        try {
            await register(username, email, password);
            router.push("/"); // Если успех - кидаем на главную
        } catch (err: any) {
            // Обработка ошибок с бэкенда
            if (err.response?.data?.username) {
                setError("Это имя пользователя уже занято");
            } else if (err.response?.data?.email) {
                setError("Этот email уже зарегистрирован");
            } else if (err.response?.data?.password) {
                setError("Пароль не соответствует требованиям");
            } else {
                setError("Ошибка регистрации. Попробуйте позже");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form className={styles.formBox} onSubmit={handleSubmit}>
                <h1 className={styles.title}>Регистрация в Groove</h1>
                
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Имя пользователя</label>
                    <input 
                        type="text" 
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                        disabled={loading}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input 
                        type="email" 
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        disabled={loading}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Пароль</label>
                    <input 
                        type="password" 
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        disabled={loading}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Повторите пароль</label>
                    <input 
                        type="password" 
                        className={styles.input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                        disabled={loading}
                    />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? "Регистрация..." : "Зарегистрироваться"}
                </button>

                <div className={styles.footer}>
                    <span>Уже есть аккаунт? </span>
                    <Link href="/login" className={styles.link}>Войти</Link>
                </div>
            </form>
        </div>
    );
}
