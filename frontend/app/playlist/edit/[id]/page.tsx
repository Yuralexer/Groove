"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { playlistApi, PlaylistDetail } from "@/lib/playlists";
import styles from "./playlist.module.css";

export default function EditPlaylistPage() {
    const params = useParams();
    const router = useRouter();

    const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await playlistApi.getPlaylist(Number(params.id));
                setPlaylist(data);
                setTitle(data.title);
            } catch (e) {
                console.error(e);
            }
        };
        if (params.id) load();
    }, [params.id]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const f = e.target.files?.[0] ?? null;
        if (!f) { setFile(null); setPreview(null); return; }
        if (!f.type.startsWith("image/")) { setError("Файл должен быть изображением"); return; }

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
        img.onerror = () => { setError("Не удалось прочитать изображение"); URL.revokeObjectURL(url); };
        img.src = url;
    };

    const submit = async () => {
        setError(null);
        if (!playlist) return;
        if (!title.trim()) { setError("Введите название"); return; }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", title.trim());
            if (file) fd.append("cover", file);

            await playlistApi.updatePlaylist(playlist.id, fd);
            router.push(`/playlist/${playlist.id}`);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data ?? "Ошибка при обновлении");
        } finally { setLoading(false); }
    };

    const remove = async () => {
        if (!playlist) return;
        if (!confirm('Удалить этот плейлист? Это действие необратимо.')) return;
        setLoading(true);
        try {
            await playlistApi.deletePlaylist(playlist.id);
            router.push('/library');
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data ?? 'Ошибка при удалении');
        } finally { setLoading(false); }
    };

    if (!playlist) return <div className="p-8">Загрузка...</div>;

    return (
        <div className={styles.editContainer}>
            <h2 className={styles.label} style={{ marginBottom: 12 }}>Редактировать плейлист</h2>

            <div className={styles.formGrid}>
                <div>
                    <div className={styles.label}>Название</div>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={styles.input} />

                    <div style={{ marginTop: 16 }}>
                        <div className={styles.label}>Описание</div>
                        <textarea defaultValue={playlist.description} rows={4} className={styles.textareaStyled} readOnly />
                    </div>

                    {error && <div style={{ color: '#ff6b6b', marginTop: 12 }}>{String(error)}</div>}

                    <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={submit} disabled={loading} className={styles.saveButton}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
                        <button onClick={() => router.push(`/playlist/${playlist.id}`)} className={styles.cancelButton}>Отмена</button>
                        <div style={{ marginLeft: 'auto' }}>
                            <button onClick={remove} disabled={loading} className={styles.dangerButton}>Удалить</button>
                        </div>
                    </div>
                </div>

                <div>
                    <div className={styles.label}>Обложка (квадратная)</div>
                    <input type="file" accept="image/*" onChange={onFileChange} className={styles.input} />
                    <div style={{ marginTop: 12 }}>
                        {preview ? <div className={styles.previewBox}><img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : (
                            playlist.cover ? <div className={styles.previewBox} style={{ backgroundImage: `url(${playlist.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : <div className={styles.previewBox} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}