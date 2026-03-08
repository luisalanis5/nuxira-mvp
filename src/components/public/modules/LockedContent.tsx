'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export interface LockedContentProps {
    id: string;
    creatorId: string;
    title: string;
    description?: string;
    price: number;
    previewImageUrl?: string;
}

/** Convierte URLs de YouTube/Vimeo a embed */
function getEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
            if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean).pop();
            if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
        }
    } catch { /* no es una URL válida */ }
    return null;
}

export default function LockedContent({ id, creatorId, title, description, price, previewImageUrl }: LockedContentProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [secretUrl, setSecretUrl] = useState('');

    const handleUnlock = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout-locked', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: id, creatorId, price, title })
            });
            const data = await res.json();

            if (res.ok && data.url) {
                // Redirigir al fan a pagar
                window.location.href = data.url;
            } else {
                toast.error(`⚠️ Error: ${data.details || data.error || 'No se pudo iniciar el pago.'}`);
            }
        } catch (error: any) {
            toast.error(`❌ Error de conexión: ${error.message || 'Verifica tu internet.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Estado Desbloqueado ---
    // NOTA MVP: Actualmente esta UI temporal lee "isUnlocked" pero el flujo real regresará
    // a la URL con ?unlock=ID_DEL_MODULO y un webhook se encargará de registrar la compra.
    // Por ahora, en esta fase, requeriríamos modificar el componente si se desea lectura instantánea de la DB.
    if (isUnlocked && secretUrl) {
        const embedUrl = getEmbedUrl(secretUrl);
        return (
            <div className="w-full my-6 bg-gray-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-green-500/50 shadow-[0_0_30px_rgba(0,255,100,0.15)] animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-2 px-6 pt-5 pb-3 text-green-400 font-bold text-sm tracking-widest uppercase">
                    <span className="text-lg">🔓</span> Acceso Concedido — {title}
                </div>
                {embedUrl ? (
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <iframe
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={title}
                        />
                    </div>
                ) : (
                    <div className="px-6 pb-6">
                        {description && <p className="text-gray-400 mb-4 text-sm">{description}</p>}
                        <a
                            href={secretUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
                        >
                            📁 Acceder al Contenido Exclusivo ↗
                        </a>
                    </div>
                )}
            </div>
        );
    }

    // --- Estado Bloqueado ---
    return (
        <div className="w-full my-6 relative overflow-hidden rounded-3xl border border-gray-800 shadow-2xl group">
            {previewImageUrl ? (
                <div className="absolute inset-0 z-0 bg-[#0d0d12]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover blur-2xl opacity-40 scale-125 group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/80 to-transparent" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0d0d12] z-0" />
            )}

            <div className="relative z-10 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <span className="text-3xl filter drop-shadow-md">🔒</span>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{title}</h3>
                {description && <p className="text-gray-400 mb-2 text-sm max-w-[260px] leading-relaxed">{description}</p>}

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-black text-white">${price}</span>
                    <span className="text-xs text-gray-500">MXN · pago único</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-6">
                    <span>💳</span> Pago seguro con Stripe · Tarjeta / Apple Pay / Google Pay
                </div>

                <button
                    onClick={handleUnlock}
                    disabled={isLoading}
                    className="w-full relative overflow-hidden group/btn bg-white text-black font-extrabold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                        ) : (
                            `🔓 Desbloquear por $${price}`
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}
