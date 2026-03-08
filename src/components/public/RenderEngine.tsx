'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, User } from 'firebase/auth';
import QnAWidget from './QnAWidget';
import NativeAd from './NativeAd';
import LinksList from './LinksList';
import MediaEmbed from './MediaEmbed';
import TipWidget from './modules/TipWidget';
import PollWidget from './modules/PollWidget';
import ImageGallery from './modules/ImageGallery';
import NewsFeed from './modules/NewsFeed';
import LockedContent from './modules/LockedContent';
import { fontDictionary } from '../../utils/fonts';
import { getUnifiedModuleStyles } from '@/lib/utils/themeUtils';
import { getSkin } from '@/config/themes';
import { APP_NAME } from '@/config/brand';

type LayoutBlock = {
    type: string;
    id: string;
    props: any;
};

type RenderEngineProps = {
    layout: LayoutBlock[];
    theme?: any;
};

const allowedComponents: Record<string, React.ElementType> = {
    qna: QnAWidget,
    nativeAd: NativeAd,
    links: LinksList,
    media: MediaEmbed,
    tip: TipWidget,
    poll: PollWidget,
    gallery: ImageGallery,
    feed: NewsFeed,
    locked: LockedContent,
};

export default function RenderEngine({ layout, theme }: RenderEngineProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthChecking(false);
        });
        return () => unsubscribe();
    }, []);

    if (!layout || layout.length === 0) return null;

    const fontClass = theme?.fontFamily && fontDictionary[theme.fontFamily]
        ? fontDictionary[theme.fontFamily].className
        : fontDictionary['Inter'].className;

    const globalStyles = getUnifiedModuleStyles(theme);
    const activeSkinId = theme?.activeSkin || 'default';
    const usesSkinCard = activeSkinId !== 'default';
    const skin = getSkin(activeSkinId as any);

    return (
        <div
            className={`w-full flex flex-col gap-6 mt-8 ${fontClass} relative z-10`}
            style={{ color: globalStyles.color, fontFamily: 'inherit' }}
        >

            {layout.map((block) => {
                const Component = allowedComponents[block.type];

                if (!Component) return null;

                // Lógica unificada de Fondos para Módulos
                const isMediaOrAd = ['nativeAd', 'media', 'gallery'].includes(block.type);
                const styles = getUnifiedModuleStyles(theme, isMediaOrAd);

                return (
                    <div
                        key={block.id}
                        // CONTENEDOR OBLIGATORIO: Se adapta a la Skin o usa defaults. Quitamos padding y fondo si es Media/Ad
                        className={`w-full box-border overflow-hidden relative ${isMediaOrAd
                            ? 'rounded-2xl'
                            : (styles.usesSkinCard ? skin.cardClass : 'rounded-2xl p-5')
                            } ${styles.hasImage && styles.usesSkinCard && !isMediaOrAd ? 'backdrop-blur-md' : ''}`}
                        style={{
                            backgroundColor: isMediaOrAd ? 'transparent' : styles.backgroundColor,
                            boxShadow: isMediaOrAd ? 'none' : styles.boxShadow,
                            border: isMediaOrAd ? 'none' : styles.border,
                            color: styles.color
                        }}
                    >
                        {/* LOS COMPONENTES DESCENDIENTES ASUMIRÁN EL TEXT-CURRENT DE LA CASCADA */}
                        <div className={!isMediaOrAd && usesSkinCard && activeSkinId !== 'cyber_glow' ? 'p-5' : ''}>
                            <Component
                                theme={theme}
                                {...block.props}
                            />
                        </div>
                    </div>
                );
            })}

        </div>
    );
}
