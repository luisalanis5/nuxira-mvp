'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { isKnownEmbedUrl } from '@/components/public/MediaEmbed';
import MediaEmbed from '@/components/public/MediaEmbed';
import { getSkin } from '@/config/themes';

export interface NewsFeedProps {
    id?: string;
    moduleId?: string;
    creatorId: string;
    title?: string;
    theme?: any;
}

export default function NewsFeed({ id, moduleId, creatorId, title = "Últimas Novedades", theme }: NewsFeedProps) {
    const skin = getSkin(theme?.activeSkin);
    const [posts, setPosts] = useState<any[]>([]);
    const [localUserId, setLocalUserId] = useState<string>('');
    const actualId = id || moduleId;

    useEffect(() => {
        let uid = localStorage.getItem('nuxira_local_uid');
        if (!uid) {
            uid = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('nuxira_local_uid', uid);
        }
        setLocalUserId(uid);

        // Bloqueo de variables indefinidas y prevención de rutas malformadas
        if (!creatorId || typeof creatorId !== 'string' || creatorId.includes('undefined')) return;
        if (!actualId || actualId.startsWith('temp-')) return;

        // Escuchamos la colección feed_posts dentro del documento del creador
        const feedRef = collection(db, 'creators', creatorId, 'feed_posts');

        // VINCULACIÓN RELACIONAL: Consultamos solo los de este módulo específico
        const q = query(
            feedRef,
            where('moduleId', '==', actualId),
            limit(10)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot: any) => {
                const newPosts = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenamiento local para sortear la falta de índice compuesto
                const sortedPosts = newPosts.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

                setPosts((prev) => {
                    const isEqual = JSON.stringify(prev) === JSON.stringify(sortedPosts);
                    return isEqual ? prev : sortedPosts;
                });
            },
            (error: any) => {
                console.error("[FIREBASE DEBUG] Fallo onSnapshot en módulo: feed | ID:", id, " | Creador:", creatorId, " | Error:", error.message);
            }
        );

        return () => unsubscribe();
    }, [creatorId, id]);

    if (posts.length === 0) return null;

    const handleLike = async (post: any) => {
        if (!localUserId) return;
        const postId = post.id;
        const isLiked = post.likedBy?.includes(localUserId);

        // Optimistic UI
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const currentLikedBy = p.likedBy || [];
                return {
                    ...p,
                    likedBy: isLiked ? currentLikedBy.filter((id: string) => id !== localUserId) : [...currentLikedBy, localUserId]
                };
            }
            return p;
        }));

        try {
            const res = await fetch('/api/feed/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId, postId, localUserId, isLiked })
            });
            if (!res.ok) {
                throw new Error("Error en servidor");
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revertir optimistic UI si falla
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return post; // restore original
                }
                return p;
            }));
        }
    };

    return (
        <div className="w-full flex flex-col h-full text-current">
            {title && <h3 className="text-xl font-bold mb-4 text-current">{title}</h3>}

            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="relative overflow-hidden group transition-all border-b border-current/10 pb-5 last:border-0 last:pb-0">
                        {/* Acento Neon a la izquierda */}
                        <div className="absolute top-0 bottom-0 left-[-16px] w-1 bg-gradient-to-b from-purple-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                        {(() => {
                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                            const matches = post.content?.match(urlRegex);
                            let embedUrl = null;

                            // Check content links
                            if (matches) {
                                for (const url of matches) {
                                    if (isKnownEmbedUrl(url)) {
                                        embedUrl = url;
                                        break;
                                    }
                                }
                            }

                            // Also check if imageUrl is a media embed like spotify/yt
                            if (!embedUrl && post.imageUrl && isKnownEmbedUrl(post.imageUrl)) {
                                embedUrl = post.imageUrl;
                            }

                            return (
                                <>
                                    <p className="text-sm md:text-base leading-relaxed mb-3 whitespace-pre-wrap text-current opacity-90">
                                        {post.content}
                                    </p>

                                    {embedUrl && (
                                        <div className="mb-3">
                                            <MediaEmbed
                                                videoUrl={embedUrl}
                                                title="Contenido adjunto"
                                            />
                                        </div>
                                    )}

                                    {post.imageUrl && !isKnownEmbedUrl(post.imageUrl) && (
                                        <div
                                            className="relative w-full h-48 rounded-xl overflow-hidden mb-3 border border-gray-700/50"
                                            onContextMenu={(e) => e.preventDefault()}
                                        >
                                            <Image
                                                src={post.imageUrl}
                                                alt="Post Attach"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <div className="flex justify-between items-center text-xs font-medium border-current/20 pt-3 mt-2 text-current opacity-70">
                            <span>{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}</span>
                            <button
                                onClick={() => handleLike(post)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${post.likedBy?.includes(localUserId)
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-black/10 hover:bg-black/20 text-current'
                                    }`}
                            >
                                <motion.span
                                    animate={post.likedBy?.includes(localUserId) ? { scale: [1, 1.5, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    {post.likedBy?.includes(localUserId) ? '💖' : '🤍'}
                                </motion.span>
                                <span>{post.likedBy?.length || post.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
