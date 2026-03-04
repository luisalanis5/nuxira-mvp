'use client';

import React from 'react';
import { FaInstagram, FaGithub, FaApple, FaGooglePlay, FaLink, FaTiktok, FaYoutube, FaFacebook, FaSpotify, FaTwitter, FaTwitch } from 'react-icons/fa';
import { getSkin } from '@/config/themes';
import { generatePalette, getUnifiedModuleStyles } from '@/lib/utils/themeUtils';

type LinksListProps = {
    modules: any[];
    theme: {
        primaryColor: string;
        mode?: string;
        fontMode?: string;
        buttonStyle?: string;
        activeSkin?: string;
        fontFamily?: string;
        videoBgUrl?: string;
        audioBgUrl?: string;
        backgroundImage?: string;
        textColor?: string;
        cardColor?: string;
        buttonColor?: string;
    };
    username?: string;
};

const getIconForUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('instagram.com')) return <FaInstagram className="w-6 h-6 text-pink-500" />;
    if (lowerUrl.includes('github.com')) return <FaGithub className="w-6 h-6 text-white" />;
    if (lowerUrl.includes('apple.com') || lowerUrl.includes('apps.apple')) return <FaApple className="w-6 h-6 text-gray-200" />;
    if (lowerUrl.includes('play.google.com')) return <FaGooglePlay className="w-6 h-6 text-green-400" />;
    if (lowerUrl.includes('tiktok.com')) return <FaTiktok className="w-6 h-6 text-white" />;
    if (lowerUrl.includes('youtube.com')) return <FaYoutube className="w-6 h-6 text-red-500" />;
    if (lowerUrl.includes('facebook.com')) return <FaFacebook className="w-6 h-6 text-blue-600" />;
    if (lowerUrl.includes('spotify.com')) return <FaSpotify className="w-6 h-6 text-green-500" />;
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return <FaTwitter className="w-6 h-6 text-blue-400" />;
    if (lowerUrl.includes('twitch.tv')) return <FaTwitch className="w-6 h-6 text-purple-600" />;
    return <FaLink className="w-6 h-6 text-gray-400" />;
};

export default function LinksList({ modules, theme, username }: LinksListProps) {
    const skin = getSkin(theme?.activeSkin as any);
    const linksModules = modules.filter((m: any) => m.type === 'links' && m.items && m.items.length > 0);

    const handleTrackClick = (moduleId: string) => {
        if (!username || !moduleId) return;

        // No esperamos (fire and forget) para no bloquear la redirección
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, moduleId }),
            keepalive: true // Asegura que se envíe incluso si la página descarga
        }).catch(err => console.error("Error tracking click", err));
    };

    if (linksModules.length === 0) {
        return (
            <div className="text-center p-6 border border-dashed border-gray-700 rounded-xl text-gray-500 w-full">
                Aún no hay enlaces publicados.
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4">
            {linksModules.map((mod: any) => {
                const linkData = mod.items[0];
                if (!linkData) return null;

                const hasImage = !!theme?.videoBgUrl || !!theme?.backgroundImage;
                const primaryColor = theme?.primaryColor || '#00FFCC';
                const palette = generatePalette(primaryColor);

                // Aplicar Unified Module Styles
                const styles = getUnifiedModuleStyles(theme);

                return (
                    <a
                        key={mod.id}
                        href={linkData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleTrackClick(mod.id)}
                        className={`group cursor-pointer relative w-full box-border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${styles.usesSkinCard ? skin.buttonClass : 'rounded-2xl p-5'} flex items-center justify-center ${styles.hasImage && styles.usesSkinCard ? 'backdrop-blur-md' : ''} ${styles.hasImage && !styles.usesSkinCard ? 'backdrop-blur-md' : ''}`}
                        style={{
                            backgroundColor: styles.backgroundColor,
                            color: styles.color,
                            fontFamily: 'inherit',
                            border: styles.border,
                            boxShadow: styles.boxShadow,
                            padding: styles.usesSkinCard ? '1.25rem' : '1.25rem' // Ensure constant padding
                        }}
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                            style={{ backgroundColor: palette.accentColor }}
                        />

                        <div className="relative z-10 flex items-center justify-center w-full gap-3 pointer-events-none">
                            {getIconForUrl(linkData.url)}
                            <span className="font-semibold transition-colors text-lg text-current" style={{ fontFamily: 'inherit', color: 'inherit', textShadow: theme?.mode === 'dark' ? '0 0 8px rgba(255,255,255,0.4)' : 'none' }}>
                                {linkData.name}
                            </span>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}
