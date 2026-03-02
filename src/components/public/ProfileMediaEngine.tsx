'use client';
import React, { useState, useRef } from 'react';

type ProfileMediaEngineProps = { videoBgUrl?: string; audioBgUrl?: string; };

export default function ProfileMediaEngine({ videoBgUrl, audioBgUrl }: ProfileMediaEngineProps) {
    const [isMuted, setIsMuted] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted((prev) => {
            if (!prev) return true;
            audioRef.current!.play().catch(() => { });
            return false;
        });
    };

    return (
        <>
            {videoBgUrl ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={videoBgUrl} alt="Background" className="fixed top-0 left-0 w-full h-full object-cover -z-20" />
                    <div className="fixed inset-0 bg-black/60 pointer-events-none -z-10"></div>
                </>
            ) : (
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black overflow-hidden"></div>
            )}

            {audioBgUrl && (
                <>
                    <audio ref={audioRef} src={audioBgUrl} loop autoPlay muted preload="metadata" />
                    <button onClick={toggleAudio} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }} className="p-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] text-white hover:scale-110 transition-transform">
                        <span className="text-xl leading-none">{isMuted ? '🔇' : '🔊'}</span>
                    </button>
                </>
            )}
        </>
    );
}
