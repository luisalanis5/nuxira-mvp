'use client';

import React, { useState } from 'react';
import { APP_NAME } from '@/config/brand';

type ShareProfileButtonProps = {
    username: string;
    displayName: string;
    primaryColor: string;
};

export default function ShareProfileButton({ username, displayName, primaryColor }: ShareProfileButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Perfil de ${displayName}`,
                    text: `¡Echa un vistazo al perfil de ${displayName} en ${APP_NAME}!`,
                    url: url
                });
            } catch (err) {
                console.error("Error compartiendo:", err);
            }
        } else {
            // Fallback
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Error copiando al portapapeles:", err);
            }
        }
    };

    return (
        <div className="absolute top-4 right-4 z-50">
            <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all shadow-lg text-white group flex items-center justify-center relative"
                style={{ '--hover-color': primaryColor } as React.CSSProperties}
                title="Compartir Perfil"
            >
                {copied ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 group-hover:text-[var(--hover-color)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-5.368m0 5.368l5.662 3.397m-5.662-3.397l5.662-3.397m0 6.794a3 3 0 100-5.368m0 5.368a3 3 0 100-5.368" />
                    </svg>
                )}

                {copied && (
                    <span className="absolute top-full mt-2 w-max right-0 px-3 py-1.5 text-xs font-bold text-black bg-white rounded-lg shadow-xl animate-[slideIn_0.2s_ease-out]">
                        ¡Enlace copiado!
                    </span>
                )}
            </button>
        </div>
    );
}
