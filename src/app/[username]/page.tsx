import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import Image from 'next/image';
import RenderEngine from '@/components/public/RenderEngine';
import LinksList from '@/components/public/LinksList';
import ProfileMediaEngine from '@/components/public/ProfileMediaEngine';
import VerifiedBadge from '@/components/public/VerifiedBadge';
import ShareProfileButton from '@/components/public/ShareProfileButton';
import { getSkin } from '@/config/themes';
import { FONT_MAP } from '@/config/fonts';
import { getUnifiedModuleStyles, getSafeTextColor } from '@/lib/utils/themeUtils';
import { APP_NAME } from '@/config/brand';
import PublicProfileCTA from '@/components/public/PublicProfileCTA';
import { getSmartAvatar } from '@/lib/firebase/profileUtils';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;

  if (!adminDb) return { title: APP_NAME };

  const snapshot = await adminDb.collection('creators').where('username', '==', username).limit(1).get();
  if (snapshot.empty) return { title: `No encontrado | ${APP_NAME}` };

  const creatorData = snapshot.docs[0].data();
  const profile = creatorData.profile || creatorData;

  return {
    title: `${profile.displayName || `@${username}`} | ${APP_NAME}`,
    description: profile.bio || `Creador en ${APP_NAME}`,
    openGraph: {
      title: `${profile.displayName || `@${username}`} | ${APP_NAME}`,
      description: profile.bio || `Creador en ${APP_NAME}`,
      images: [profile.avatarUrl || getSmartAvatar(profile.displayName, username)],
    }
  };
}

export default async function CreatorProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  if (!adminDb) {
    console.error("❌ Base de datos Admin no inicializada");
    return notFound();
  }

  // 1. Obtener datos del creador desde Firestore
  const snapshot = await adminDb.collection('creators').where('username', '==', username).limit(1).get();
  if (snapshot.empty) return notFound();

  const creatorData = snapshot.docs[0].data();
  const profile = creatorData.profile || creatorData;
  const theme = creatorData.theme || { primaryColor: '#00FFCC', mode: 'dark', activeSkin: 'default' };
  const modules = creatorData.modules || [];
  const isPremium = creatorData.isPremium || false;
  const isVerified = creatorData.isVerified || false;

  const skin = getSkin(theme.activeSkin);

  // 0. Fetch Public Q&A
  let publicQuestions: any[] = [];
  try {
    const qaSnapshot = await adminDb.collection('questions')
      .where('receiverId', '==', snapshot.docs[0].id)
      .where('isPublic', '==', true)
      .get();

    publicQuestions = qaSnapshot.docs.map(doc => ({
      id: doc.id,
      content: doc.data().content,
      replyText: doc.data().replyText,
      repliedAt: doc.data().repliedAt?.toMillis() || 0
    }));

    // Sort locally by repliedAt descending to avoid complex indexing
    publicQuestions.sort((a, b) => b.repliedAt - a.repliedAt);
  } catch (err) {
    console.error("Error obteniendo Q&A públicos:", err);
  }

  // ============================================
  // ⚙️ LÓGICA DE ORDENAMIENTO ESTRICTA UI AS DATA
  // ============================================

  // 1. Extraemos SOLO los de tipo "links" para los botones fijos (Estáticos en UI)
  const linksModules = modules.filter((mod: any) => mod.type === 'links');

  // 2. Extraemos los módulos dinámicos (Todos excepto 'links')
  const dynamicModules = modules.filter((mod: any) => mod.type !== 'links');

  // 3. Construimos el layout dinámico para inyectarlo en el RenderEngine
  const dynamicLayout: any[] = [];

  // 3a. Inyectar SIEMPRE el bloque interactivo de Q&A (Regla Estricta)
  dynamicLayout.push({
    type: 'qna',
    id: 'qna-core',
    props: {
      creatorId: snapshot.docs[0].id,
      title: `¡Pregúntale a ${profile.displayName || `@${username}`}!`,
      placeholder: 'Haz tu pregunta anónimamente aquí...',
      publicQuestions
    }
  });

  // 3b. Mapeamos los módulos dinámicos universalmente
  dynamicModules.forEach((mod: any) => {
    // Si el creador no es Premium, sus módulos Paywall quedan ocultos del perfil público
    if (!isPremium && mod.type === 'locked') {
      return;
    }

    if (mod.props) {
      const safeProps = { ...mod.props };
      if (mod.type === 'locked' && safeProps.secretContent) {
        delete safeProps.secretContent; // SEGURIDAD CRÍTICA: Nunca filtrar el secreto al HTML del cliente
      }

      dynamicLayout.push({
        type: mod.type,
        id: mod.id,
        props: {
          ...safeProps,
          id: mod.id, // Fixed: LockedContent expects 'id'
          moduleId: mod.id, // Estandarizado para el Mapper
          creatorId: snapshot.docs[0].id, // Props estándar
          moduleData: mod.props, // Objeto completo para flexibilidad móvil
          username
        }
      });
    }
  });

  // 3c. Lógica Híbrida de Monetización: Inyectar Anuncios de la Plataforma (Nuxira Ad Engine) a usuarios Free
  console.log("¿Es premium?:", isPremium);
  if (!isPremium) {
    try {
      // Consultar anuncios globales activos del Admin
      const adsSnapshot = await adminDb.collection('platform_ads').get();
      console.log("Anuncios encontrados:", adsSnapshot.size);

      if (!adsSnapshot.empty) {
        // Seleccionar uno aleatoriamente
        const randomDoc = adsSnapshot.docs[Math.floor(Math.random() * adsSnapshot.docs.length)];
        const data = randomDoc.data();

        // Inyectar al final del layout
        dynamicLayout.push({
          type: 'nativeAd',
          id: randomDoc.id,
          props: {
            title: data.title,
            description: data.description,
            ctaText: data.ctaText,
            url: data.url,
            image: data.image
          }
        });
      }
    } catch (err) {
      console.error("Error obteniendo platform_ads:", err);
      // Si falla o está vacío, NO inyectar nada para evitar romper la página
    }
  }

  // ============================================

  // Segmento final de CreatorProfile() en src/app/[username]/page.tsx
  // Extraer colores globales seguro
  const primaryColor = theme.primaryColor || '#00FFCC';
  const textColor = getSafeTextColor(primaryColor);

  // Variables CSS puras para la fuente de Google
  const customFontFamily = theme.fontFamily && FONT_MAP[theme.fontFamily] ? FONT_MAP[theme.fontFamily] : 'var(--font-inter)';

  // Unificar estilo del Header con el resto de módulos
  const headerStyles = getUnifiedModuleStyles(theme, false);

  // Calcular Glow Fuerte para Textos Claros
  const isHeaderWhite = headerStyles.color === '#FFFFFF';

  const activeSkinId = theme.activeSkin || 'default';
  const isDefaultSkin = activeSkinId === 'default';
  const hasImage = !!theme.videoBgUrl || !!theme.backgroundImage;

  // Si no es el skin por defecto, usamos el contenedor del skin.
  // Si tiene imagen, forzamos que el contenedor base sea transparente para no tapar la imagen
  const mainClass = `min-h-screen w-full overflow-x-hidden antialiased ${!isDefaultSkin ? skin.containerClass : 'bg-[#0d0d12]'} ${hasImage ? '!bg-transparent !bg-none' : ''}`;

  // Extraemos variables globales para el RenderEngine
  const globalStyles = getUnifiedModuleStyles(theme);

  const mainStyle = {
    fontFamily: customFontFamily,
    color: isDefaultSkin ? textColor : undefined
  };

  return (
    <main
      className={mainClass}
      style={mainStyle}
    >
      <ProfileMediaEngine
        videoBgUrl={theme.videoBgUrl}
        backgroundImage={theme.backgroundImage}
        audioBgUrl={theme.audioBgUrl}
        primaryColor={primaryColor}
      />

      {/* Overlay opcional para el color primario (Skin Base) */}
      {!theme.videoBgUrl && !theme.backgroundImage && (
        <div
          className="fixed inset-0 z-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${primaryColor} 0%, transparent 50%)` }}
        />
      )}

      {/* OVERLAY GLOBAL PARA FONDOS: Oscurecimiento forzado detrás de todos los módulos */}
      {hasImage && (
        <div className={`fixed inset-0 ${textColor === '#FFFFFF' ? 'bg-black/50' : 'bg-white/20'} z-0 pointer-events-none`} />
      )}

      <div className="relative z-10 max-w-md mx-auto p-6 pt-16 flex flex-col items-center">
        {/* Cabecera del Creador Unificada */}
        <div
          className={`relative flex items-center gap-6 p-6 w-full max-w-2xl mx-auto mb-8 overflow-hidden transition-all duration-300 ${headerStyles.usesSkinCard ? skin.cardClass : 'rounded-3xl shadow-xl'} ${headerStyles.hasImage ? 'backdrop-blur-md' : ''}`}
          style={{
            backgroundColor: headerStyles.backgroundColor,
            boxShadow: headerStyles.boxShadow,
            border: headerStyles.border,
            color: headerStyles.color
          }}
        >
          <ShareProfileButton username={username} displayName={profile.displayName || username} primaryColor={primaryColor} />

          {/* EFECTO ANILLO / PROFILE RING: Ahora parametrizable al color de Acento */}
          <div
            className="relative w-24 h-24 rounded-full border-[3px] shadow-lg flex-shrink-0 overflow-hidden"
            style={{
              borderColor: theme.primaryColor,
              boxShadow: `0 0 25px ${theme.primaryColor}60, inset 0 0 10px ${theme.primaryColor}40` // Glow dinámico
            }}
          >
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.displayName || username} fill sizes="96px" className="object-cover" priority />
            ) : (
              <Image src={getSmartAvatar(profile.displayName, username)} alt={profile.displayName || username} fill sizes="96px" className="object-cover" priority />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-tight break-words text-left flex items-center text-current gap-2" style={{ fontFamily: 'inherit', color: isHeaderWhite ? '#FFFFFF' : 'inherit' }}>
              <span>{profile.displayName || `@${username}`}</span>
              {isVerified && <VerifiedBadge />}
            </h1>
            <p className="text-lg break-words text-left mt-1 text-current" style={{ fontFamily: 'inherit', color: isHeaderWhite ? '#FFFFFF' : 'inherit' }}>
              {profile.bio || `Creador en ${APP_NAME}`}
            </p>
            <span className="text-sm mt-1 block text-left opacity-60">
              {process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/{username}
            </span>
          </div>
        </div>

        {/* Links Estáticos */}
        <div className="w-full mb-2">
          <LinksList modules={linksModules} theme={theme} username={username} />
        </div>

        {/* Módulos Dinámicos */}
        <RenderEngine layout={dynamicLayout} theme={theme} />

        {/* CTA Dinámico (Footer) */}
        <PublicProfileCTA
          appName={APP_NAME}
          textColor={textColor}
          primaryColor={theme.primaryColor || '#c2cdff'}
        />
      </div>
    </main>
  );
}