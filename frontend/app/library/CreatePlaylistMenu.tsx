"use client";

import { useState } from "react";
import { playlistApi } from "@/lib/playlists";
import styles from "./library.module.css";

export default function CreatePlaylistMenu({ onCreated }: { onCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const toggle = () => {
        setError(null);
        setOpen(!open);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const f = e.target.files?.[0] ?? null;
        if (!f) {
            setFile(null);
            setPreview(null);
            return;
        }

        if (!f.type.startsWith("image/")) {
            setError("Файл должен быть изображением");
            return;
        }

        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
            if (img.width !== img.height) {
                setError("Изображение должно быть квадратным");
                setFile(null);
                setPreview(null);
                URL.revokeObjectURL(url);
            } else {
                setFile(f);
                setPreview(url);
            }
        };
        img.onerror = () => {
            setError("Не удалось прочитать изображение");
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const submit = async () => {
        setError(null);
        if (!title.trim()) {
            setError("Введите название плейлиста");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", title.trim());
            if (file) fd.append("cover", file);

            await playlistApi.createPlaylist(fd);

            setTitle("");
            setFile(null);
            setPreview(null);
            setOpen(false);

            if (onCreated) onCreated();
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.cover ?? err?.response?.data ?? "Ошибка при создании плейлиста");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.createWrapper}>
            <button className={styles.createButton} onClick={toggle}>Создать плейлист</button>

            {open && (
                <div className={styles.createPanel} role="dialog">
                    <div className={styles.field}>
                        <label>Название</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className={styles.field}>
                        <label>Обложка (квадратная)</label>
                        <input type="file" accept="image/*" onChange={onFileChange} />
                        {preview && <img src={preview} alt="preview" className={styles.preview} />}
                    </div>

                    {error && <div className={styles.error}>{String(error)}</div>}

                    <div className={styles.actions}>
                        <button onClick={() => setOpen(false)} className={styles.secondary}>Отмена</button>
                        <button onClick={submit} disabled={loading} className={styles.primary}>{loading ? 'Создание...' : 'Создать'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
