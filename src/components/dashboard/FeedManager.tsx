'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase/client';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function FeedManager() {
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        // Bloqueo de variables indefinidas
        if (!auth.currentUser?.uid || typeof auth.currentUser.uid !== 'string' || auth.currentUser.uid.includes('undefined')) return;

        const creatorId = auth.currentUser.uid;
        const feedRef = collection(db, 'creators', creatorId, 'feed_posts');
        const q = query(feedRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                console.error("[FIREBASE DEBUG] Fallo onSnapshot en FeedManager | Creador:", creatorId, " | Error:", error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !content.trim()) return;

        setIsPublishing(true);
        try {
            const feedRef = collection(db, 'creators', auth.currentUser.uid, 'feed_posts');
            await addDoc(feedRef, {
                content,
                imageUrl,
                likes: 0,
                likedBy: [],
                createdAt: serverTimestamp()
            });

            setContent('');
            setImageUrl('');
        } catch (error) {
            console.error("Error al publicar Novedad", error);
            toast.error("Error al publicar.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!auth.currentUser) return;
        if (!confirm('¿Eliminar esta publicación?')) return;

        try {
            await deleteDoc(doc(db, 'creators', auth.currentUser.uid, 'feed_posts', postId));
        } catch (error) {
            console.error("Error al eliminar", error);
            toast.error("No se pudo eliminar.");
        }
    };

    return (
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 mt-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>📰</span> Creador Studio (Feed Manager)
            </h3>
            <p className="text-gray-400 text-sm mb-6">
                Publica actualizaciones, noticias y fotos directamente en tu perfil público para tus seguidores.
            </p>

            <form onSubmit={handlePublish} className="bg-gray-800/40 p-5 rounded-2xl mb-8 space-y-4 border border-gray-700/80 shadow-inner">
                <textarea
                    placeholder="¿Qué quieres compartir con tus fans hoy?"
                    required
                    rows={3}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all resize-none"
                />
                <div>
                    <input
                        type="url"
                        placeholder="URL de imagen adjunta (Opcional)"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    />
                    <p className="text-gray-400 text-[11px] mt-2 ml-1">
                        Pega el enlace directo de tu post de Instagram, imagen externa o pista de Spotify. No alojamos el archivo para que tu perfil cargue más rápido.
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isPublishing || !content.trim()}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        {isPublishing ? 'Publicando...' : 'Publicar Ahora'}
                    </button>
                </div>
            </form>

            {/* Historial de Posts */}
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Tus Publicaciones Recientes</h4>
            <div className="space-y-4">
                {posts.length === 0 && <p className="text-gray-500 text-sm italic py-4">Aún no has publicado nada. ¡Escribe tu primer post!</p>}
                {posts.map(post => (
                    <div key={post.id} className="p-4 bg-gray-800/20 border border-gray-700/50 rounded-2xl relative group">
                        <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
                        {post.imageUrl && (
                            <div className="relative mt-3 w-full h-32 rounded-lg border border-gray-700 overflow-hidden">
                                <Image src={post.imageUrl} alt="Adjunto" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                            </div>
                        )}
                        <div className="text-xs text-gray-500 mt-3 flex justify-between">
                            <span>{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Justo ahora'}</span>
                            <span className="flex items-center gap-1">❤️ {post.likes || 0}</span>
                        </div>

                        <button
                            onClick={() => handleDelete(post.id)}
                            className="absolute top-4 right-4 p-2 text-gray-500 bg-gray-900/50 hover:bg-red-500/20 hover:text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/30"
                            title="Eliminar Publicación"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
