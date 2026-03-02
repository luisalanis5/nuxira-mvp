'use client';
import React, { useEffect, useState, useRef } from 'react';

type ProfileMediaEngineProps = {
    videoBgUrl?: string;
    audioBgUrl?: string;
};

/**
 * Extrae el videoId de cualquier variante de URL de YouTube:
 * - https://youtu.be/VIDEO_ID
 * - https://youtu.be/VIDEO_ID?si=XXXX
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&si=XXXX
 */
function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.replace('www.', '');

        if (host === 'youtu.be') {
            // pathname = /Afe0VDjezXc  → tomar primer segmento
            const id = u.pathname.split('/').filter(Boolean)[0];
            return id || null;
        }
        if (host === 'youtube.com') {
            // ?v=VIDEO_ID
            return u.searchParams.get('v');
        }
    } catch { /* url inválida */ }
    return null;
}

function buildEmbedUrl(videoBgUrl: string): string | null {
    const ytId = extractYouTubeId(videoBgUrl);
    if (ytId) {
        return (
            `https://www.youtube-nocookie.com/embed/${ytId}` +
            `?autoplay=1&mute=1&loop=1&playlist=${ytId}` +
            `&controls=0&rel=0&modestbranding=1&playsinline=1`
        );
    }
    // Vimeo
    try {
        const u = new URL(videoBgUrl);
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean).pop();
            if (id) return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1&dnt=1`;
        }
    } catch { /* */ }
    return null;
}

function isDirectMp4(url: string): boolean {
    try {
        return /\.(mp4|webm|ogg)(\?|$)/i.test(new URL(url).pathname);
    } catch { return false; }
}

export default function ProfileMediaEngine({ videoBgUrl, audioBgUrl }: ProfileMediaEngineProps) {
    const [isMuted, setIsMuted] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(prev => {
            if (!prev) return true; // muting
            audioRef.current!.play().catch(() => { });
            return false;
        });
    };

    const embedUrl = videoBgUrl ? buildEmbedUrl(videoBgUrl) : null;
    const isMp4 = videoBgUrl ? isDirectMp4(videoBgUrl) : false;

    const BG_STYLE: React.CSSProperties = {
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: -10,
        pointerEvents: 'none',
        overflow: 'hidden',
    };

    return (
        <>
            {/* ── Fondo Dinámico Animado o Imagen Estática ── */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
                {videoBgUrl && !embedUrl && !isMp4 && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={videoBgUrl}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                        />
                    </>
                )}
            </div>

            {/* ── Audio ambiental ── */}
            {audioBgUrl && (
                <>
                    <audio ref={audioRef} src={audioBgUrl} loop autoPlay muted preload="metadata" />
                    <button
                        onClick={toggleAudio}
                        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}
                        className="p-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] text-white hover:scale-110 transition-transform flex items-center justify-center"
                        title={isMuted ? 'Activar audio ambiental' : 'Silenciar audio'}
                    >
                        <span className="text-xl leading-none">{isMuted ? '🔇' : '🔊'}</span>
                    </button>
                </>
            )}
        </>
    );
}
