"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation"; // Для переадресации
import styles from "./login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Чтобы страница не перезагружалась
        setError("");

        try {
            await login(email, password);
            router.push("/"); // Если успех - кидаем на главную
        } catch (err) {
            setError("Неверный email или пароль");
        }
    };

    return (
        <div className={styles.container}>
            <form className={styles.formBox} onSubmit={handleSubmit}>
                <h1 className={styles.title}>Вход в Groove</h1>
                
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input 
                        type="email" 
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
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
                    />
                </div>

                <button type="submit" className={styles.button}>Войти</button>
            </form>
        </div>
    );
}