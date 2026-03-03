'use client';
import React, { useState, useRef } from 'react';

type ProfileMediaEngineProps = {
    videoBgUrl?: string;
    backgroundImage?: string;
    audioBgUrl?: string;
    primaryColor?: string; // Requerido para el overlay
};

export default function ProfileMediaEngine({ videoBgUrl, backgroundImage, audioBgUrl, primaryColor = '#000000' }: ProfileMediaEngineProps) {
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
            {(videoBgUrl || backgroundImage) && (
                <>
                    {/* Imagen cruda en el fondo absoluto super al fondo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={(videoBgUrl || backgroundImage) as string}
                        alt="Background"
                        className="fixed inset-0 w-full h-full object-cover -z-20"
                    />
                    {/* El RenderEngine aplicará el overlay bg-black/60, aquí dejamos uno genérico como base por seguridad */}
                    <div
                        className="fixed inset-0 -z-10 bg-black/40 pointer-events-none"
                    ></div>
                </>
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
