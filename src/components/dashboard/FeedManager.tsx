'use client';

import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function FeedManager({ feedModules, creatorId }: { feedModules: any[], creatorId: string }) {
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [orphanCount, setOrphanCount] = useState(0);

    // Default al primer módulo Feed disponible
    const [selectedModuleId, setSelectedModuleId] = useState<string>(feedModules[0]?.id || '');

    // Actualizar selección si cambian los módulos y el actual ya no existe
    useEffect(() => {
        if (feedModules.length > 0 && !feedModules.find(m => m.id === selectedModuleId)) {
            setSelectedModuleId(feedModules[0].id);
        }
    }, [feedModules, selectedModuleId]);

    useEffect(() => {
        // Bloqueo de variables indefinidas
        if (!auth.currentUser?.uid || typeof auth.currentUser.uid !== 'string' || auth.currentUser.uid.includes('undefined')) return;

        const creatorId = auth.currentUser.uid;
        const feedRef = collection(db, 'creators', creatorId, 'feed_posts');

        // VINCULACIÓN RELACIONAL: Filtramos por módulo si no es 'all'
        let q = query(feedRef);

        if (selectedModuleId !== 'all') {
            q = query(feedRef, where('moduleId', '==', selectedModuleId));
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Deduplicate locally to avoid React 18 strict mode + Firebase cache duplicates
                const uniquePostsMap = new Map();
                fetchedPosts.forEach(post => uniquePostsMap.set(post.id, post));

                // Ordenamiento local para sortear la falta de índice DB
                const sortedPosts = Array.from(uniquePostsMap.values()).sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

                setPosts(sortedPosts);
            },
            (error) => {
                console.error("[FIREBASE DEBUG] Fallo onSnapshot en FeedManager | Creador:", creatorId, " | Error:", error.message);
            }
        );

        return () => unsubscribe();
    }, [selectedModuleId, creatorId]);

    // Buscador de Posts Huérfanos (sin moduleId)
    useEffect(() => {
        if (!auth.currentUser?.uid || !selectedModuleId) return;

        const feedRef = collection(db, 'creators', auth.currentUser.uid, 'feed_posts');
        const qOrphans = query(feedRef);
        // Traemos todos para contar los que no tienen moduleId (las queries nativas de firestore para "no existe campo" requieren indexación compleja, mejor filtrar client-side para la migración de 1 vez)

        const unsubs = onSnapshot(qOrphans, (snapshot) => {
            let count = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data.moduleId) count++;
            });
            setOrphanCount(count);
        });

        return () => unsubs();
    }, [selectedModuleId]);

    const handleMigrateOrphans = async () => {
        if (!auth.currentUser?.uid || !selectedModuleId) return;
        if (!confirm(`¿Quieres vincular tus ${orphanCount} publicaciones antiguas a este Módulo Feed actual?`)) return;

        setIsMigrating(true);
        try {
            const feedRef = collection(db, 'creators', auth.currentUser.uid, 'feed_posts');
            const snapshot = await getDocs(query(feedRef));

            let migrated = 0;
            const batch = writeBatch(db); // Podríamos usar batch si son menos de 500

            for (const document of snapshot.docs) {
                const data = document.data();
                if (!data.moduleId) {
                    const docRef = doc(db, 'creators', auth.currentUser.uid, 'feed_posts', document.id);
                    await updateDoc(docRef, { moduleId: selectedModuleId });
                    migrated++;
                }
            }

            toast.success(`Se vincularon ${migrated} publicaciones antiguas con éxito.`);
            setOrphanCount(0);
        } catch (error) {
            console.error("Error migrando", error);
            toast.error("Hubo un error al migrar los posts antiguos.");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleMovePost = async (postId: string, newModuleId: string) => {
        if (!auth.currentUser || !newModuleId) return;
        setIsPublishing(true);
        try {
            const postRef = doc(db, 'creators', auth.currentUser.uid, 'feed_posts', postId);
            await updateDoc(postRef, { moduleId: newModuleId });
            toast.success("Publicación movida con éxito.");
        } catch (error) {
            console.error("Error al mover post", error);
            toast.error("Error al mover la publicación.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !content.trim()) return;

        // No se puede publicar en vista "Todas"
        const targetModuleId = selectedModuleId === 'all' ? feedModules[0]?.id : selectedModuleId;

        if (!targetModuleId) {
            toast.error("Crea un módulo de Novedades primero.");
            return;
        }

        setIsPublishing(true);
        try {
            const feedRef = collection(db, 'creators', auth.currentUser.uid, 'feed_posts');
            await addDoc(feedRef, {
                content,
                imageUrl,
                moduleId: targetModuleId, // INYECCIÓN RELACIONAL!
                likes: 0,
                likedBy: [],
                createdAt: serverTimestamp()
            });

            setContent('');
            setImageUrl('');
            toast.success("¡Publicado!");
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <span>📰</span> Creador Studio (Feed Manager)
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Publica actualizaciones, noticias y fotos en tu muro de novedades.
                    </p>
                </div>

                {feedModules.length > 0 && (
                    <div className="bg-gray-800/80 p-2 rounded-xl border border-gray-700/50 flex flex-col shrink-0 min-w-[240px]">
                        <span className="text-[10px] uppercase font-black text-[#00FFCC] mb-1 ml-1 px-1 tracking-widest">
                            {selectedModuleId === 'all' ? '🔍 Viendo Historial:' : '🚀 Enviando a:'}
                        </span>
                        <select
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="w-full bg-gray-900 text-white font-bold border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00FFCC] transition-colors"
                        >
                            <option value="all" className="font-bold text-[#00FFCC]">📁 Todas las Publicaciones</option>
                            <hr className="border-gray-800" />
                            {feedModules.map(m => (
                                <option key={m.id} value={m.id}>📍 {m.title}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <form onSubmit={handlePublish} className="bg-gray-800/40 p-5 rounded-2xl mb-8 space-y-4 border border-gray-700/80 shadow-inner">
                <textarea
                    placeholder="¿Qué quieres compartir con tus fans hoy?"
                    required
                    rows={3}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all resize-none"
                />
                <div className="flex flex-col md:flex-row gap-2">
                    <input
                        type="url"
                        placeholder="URL de imagen adjunta (Opcional)"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all flex-1"
                    />
                    <label className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm cursor-pointer hover:bg-gray-700 transition-all text-white font-bold h-full md:w-auto w-full">
                        <span>📤 Subir Foto</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !auth.currentUser) return;
                                if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no puede superar 2MB'); return; }
                                setIsPublishing(true);
                                try {
                                    const storageRef = ref(storage, `creators/${auth.currentUser.uid}/feed/${Date.now()}.jpg`);
                                    await uploadBytes(storageRef, file);
                                    const url = await getDownloadURL(storageRef);
                                    setImageUrl(url);
                                    toast.success('Imagen subida con éxito');
                                } catch (err: any) {
                                    console.error('[FEED UPLOAD ERROR]', err);
                                    toast.error(`Error al subir imagen: ${err?.code || err?.message || 'desconocido'}`);
                                } finally {
                                    setIsPublishing(false);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </label>
                </div>
                <p className="text-gray-400 text-[11px] mt-2 ml-1">
                    Pega una URL o sube directamente tu foto (máx 2MB).
                </p>

                <div className="flex flex-col md:flex-row justify-between items-center pt-2 gap-4">
                    <p className="text-gray-500 text-[11px] ml-1 order-2 md:order-1">
                        {selectedModuleId === 'all'
                            ? `⚠️ Estás en vista general. Se publicará en "${feedModules[0]?.title || '...'}" por defecto.`
                            : `Esta publicación aparecerá solo en: ${feedModules.find(m => m.id === selectedModuleId)?.title}`
                        }
                    </p>
                    <button
                        type="submit"
                        disabled={isPublishing || !content.trim()}
                        className="w-full md:w-auto px-8 py-3 bg-[#00FFCC] hover:bg-[#00e6b8] text-black text-sm font-bold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-[#00FFCC]/20 active:scale-95 order-1 md:order-2"
                    >
                        {isPublishing ? 'Publicando...' : 'Publicar Ahora'}
                    </button>
                </div>
            </form>

            {/* Aviso de Migración si hay posts huérfanos */}
            {orphanCount > 0 && feedModules.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-yellow-400 font-bold text-sm">Actualización del Sistema</p>
                            <p className="text-gray-400 text-xs">Tienes {orphanCount} publicación(es) antigua(s) que no están vinculadas a ningún Módulo Feed. ¿Deseas vincularlas al módulo actual "{feedModules.find(m => m.id === selectedModuleId)?.title}"?</p>
                        </div>
                    </div>
                    <button
                        onClick={handleMigrateOrphans}
                        disabled={isMigrating}
                        className="px-4 py-2 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors shrink-0 disabled:opacity-50"
                    >
                        {isMigrating ? 'Vinculando...' : 'Vincular Posts Antiguos'}
                    </button>
                </div>
            )}

            {/* Historial de Posts */}
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Tus Publicaciones Recientes</h4>
            <div className="space-y-4">
                {posts.length === 0 && <p className="text-gray-500 text-sm italic py-4">Aún no has publicado nada. ¡Escribe tu primer post!</p>}
                {posts.map(post => {
                    const postModule = feedModules.find(m => m.id === post.moduleId);
                    return (
                        <div key={post.id} className="p-4 bg-gray-800/20 border border-gray-700/50 rounded-2xl relative group hover:bg-gray-800/30 transition-all">
                            <div className="flex justify-between items-start mb-2 pr-10">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${postModule ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'}`}>
                                        {postModule ? `📍 ${postModule.title}` : '⚠️ Sin Módulo'}
                                    </span>
                                    {feedModules.length > 1 && (
                                        <div className="flex items-center gap-1 group/move">
                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Mover a:</span>
                                            <select
                                                className="bg-gray-900 border border-gray-700 text-[9px] text-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-[#00FFCC] cursor-pointer hover:border-gray-500 transition-colors"
                                                onChange={(e) => handleMovePost(post.id, e.target.value)}
                                                value={post.moduleId || ''}
                                            >
                                                <option value="" disabled>Seleccionar...</option>
                                                {feedModules.map(m => (
                                                    <option key={m.id} value={m.id}>{m.id === post.moduleId ? `(Actual) ${m.title}` : m.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && (
                                <div
                                    className="relative mt-3 w-full h-32 rounded-lg border border-gray-700 overflow-hidden"
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    <Image src={post.imageUrl} alt="Adjunto" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                                </div>
                            )}
                            <div className="text-xs text-gray-500 mt-3 flex justify-between">
                                <span>{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Justo ahora'}</span>
                                <span className="flex items-center gap-1">❤️ {post.likedBy?.length || post.likes || 0}</span>
                            </div>

                            <button
                                onClick={() => handleDelete(post.id)}
                                className="absolute top-4 right-4 p-2 text-gray-500 bg-gray-900/50 hover:bg-red-500/20 hover:text-red-400 rounded-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/30"
                                title="Eliminar Publicación"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
