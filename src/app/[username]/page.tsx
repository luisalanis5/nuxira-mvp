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

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;

  if (!adminDb) return { title: 'Nexia' };

  const snapshot = await adminDb.collection('creators').where('username', '==', username).limit(1).get();
  if (snapshot.empty) return { title: 'No encontrado | Nexia' };

  const creatorData = snapshot.docs[0].data();
  const profile = creatorData.profile || {};

  return {
    title: `${profile.displayName || `@${username}`} | Nexia`,
    description: profile.bio || "Creador en Nexia",
    openGraph: {
      title: `${profile.displayName || `@${username}`} | Nexia`,
      description: profile.bio || "Creador en Nexia",
      images: [profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`],
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
  const profile = creatorData.profile || {};
  const theme = creatorData.theme || { primaryColor: '#00FFCC', mode: 'dark', activeSkin: 'default' };
  const modules = creatorData.modules || [];
  const isPremium = creatorData.isPremium || false;
  const isVerified = creatorData.isVerified || false;

  const skin = getSkin(theme.activeSkin);

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
      placeholder: 'Haz tu pregunta anónimamente aquí...'
    }
  });

  // 3b. Mapeamos los módulos dinámicos universalmente
  dynamicModules.forEach((mod: any) => {
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
          moduleId: mod.id, // Estandarizado para el Mapper
          creatorId: snapshot.docs[0].id, // Props estándar
          moduleData: mod.props, // Objeto completo para flexibilidad móvil
          username
        }
      });
    }
  });

  // 3c. Lógica Híbrida de Monetización: Inyectar Anuncios de la Plataforma (Nexia Ad Engine) a usuarios Free
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

  const fontClass = theme.fontFamily && FONT_MAP[theme.fontFamily] ? FONT_MAP[theme.fontFamily] : skin.baseFont;

  return (
    <main className={`${skin.containerClass} ${fontClass}`}>
      <ProfileMediaEngine videoBgUrl={theme.videoBgUrl} audioBgUrl={theme.audioBgUrl} />

      {/* Fondo Neon Custom si no es gotham o burton (opcional, lo mantenemos por ahora) */}
      {theme.activeSkin !== 'gotham' && theme.activeSkin !== 'burton' && (
        <div
          className="fixed inset-0 z-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${theme.primaryColor} 0%, transparent 50%)` }}
        />
      )}

      <div className="relative z-10 max-w-md mx-auto p-6 pt-16 flex flex-col items-center">
        {/* Contenedor principal de la cabecera: Usamos Flexbox con skin classes si queremos, o mantenemos el glass */}
        <div className={`relative flex items-center gap-6 p-6 rounded-3xl w-full max-w-2xl mx-auto mb-8 ${skin.cardClass}`}>
          <ShareProfileButton username={username} displayName={profile.displayName || username} primaryColor={theme.primaryColor} />

          {/* Contenedor de la Imagen: FIJO para evitar estiramiento. w-24 h-24 y flex-shrink-0 son VITALES */}
          <div className="relative w-24 h-24 rounded-full border-4 border-purple-500/50 shadow-lg glow-purple flex-shrink-0 overflow-hidden" style={{ borderColor: theme.primaryColor }}>
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName || username}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800 rounded-full text-3xl">
                👤
              </div>
            )}
          </div>

          {/* Contenedor de Texto: flex-1 para ocupar el resto del espacio */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-3xl font-bold leading-tight break-words text-left flex items-center ${skin.textClass}`}>
              {profile.displayName || `@${username}`}
              {(isPremium || isVerified) && <VerifiedBadge />}
            </h1>
            <p className="text-gray-400 text-lg break-words text-left mt-1">
              {profile.bio || "Creador en Nexia"}
            </p>
            <span className="text-gray-500 text-sm mt-1 block text-left">
              nexia.app/{username}
            </span>
          </div>

        </div>

        {/* --- ENLACES ESTÁTICOS ANCLADOS DESDE FIRESTORE --- */}
        <div className="w-full mb-2">
          <LinksList modules={linksModules} theme={theme} username={username} />
        </div>

        {/* --- MOTOR ORQUESTADOR DINÁMICO DESDE FIRESTORE --- */}
        {/* Aquí se inyecta Q&A seguido de los Anuncios y Medios del usuario */}
        <RenderEngine layout={dynamicLayout} theme={theme} />

        {/* Footer */}
        <div className="mt-16 mb-8 text-center text-sm font-medium text-gray-600 flex flex-col items-center gap-2">
          <div className="w-10 h-1 rounded-full bg-gray-800 mb-2"></div>
          <a href="/" className="hover:text-gray-400 transition-colors">
            Potenciado por <span className="font-bold text-white tracking-widest uppercase" style={{ color: theme.primaryColor }}>NEXIA</span>
          </a>
        </div>
      </div>
    </main>
  );
}