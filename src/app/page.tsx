'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/brand';
import NuxiraLogo from '@/components/ui/NuxiraLogo';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center selection:bg-[#c2cdff] selection:text-black">
      {/* Navbar Minimalista */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">
            <NuxiraLogo />
          </div>
          <span className="font-bold tracking-widest text-lg">{APP_NAME}</span>
        </div>
        <div className="flex gap-4">
          {!loading && user ? (
            <button onClick={() => router.push('/dashboard')} className="bg-[#c2cdff] text-black font-bold text-sm px-6 py-2 rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(194,205,255,0.4)]">
              Ir al Centro de Mando
            </button>
          ) : (
            <>
              <Link href="/dashboard/login" className="text-gray-400 hover:text-white font-medium text-sm transition-colors py-2 px-4 hidden sm:block">
                Entrar
              </Link>
              <Link href="/dashboard/register" className="bg-white text-black font-bold text-sm px-6 py-2 rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                Empezar Gratis
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center text-center mt-12 mb-20 z-10 relative">

        {/* Logo Gigante con Glow */}
        <div className="w-32 h-32 md:w-48 md:h-48 mb-8 group transition-transform duration-700 hover:scale-110 relative">
          <div className="absolute inset-0 bg-[#c2cdff] blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full" />
          <NuxiraLogo className="relative z-10 filter drop-shadow-[0_0_15px_rgba(194,205,255,0.4)] group-hover:drop-shadow-[0_0_25px_rgba(194,205,255,0.8)] transition-all duration-700" />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
          UNIFICA TU<br />HUELLA DIGITAL
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
          La centralización definitiva de tus enlaces, contenido e identidad social.
          Un solo lugar para conectar todo tu mundo con un diseño impecable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {!loading && user ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-[#c2cdff] text-black font-extrabold tracking-wide rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(194,205,255,0.3)] hover:shadow-[0_0_40px_rgba(194,205,255,0.6)]"
            >
              IR AL DASHBOARD
            </button>
          ) : (
            <>
              <Link
                href="/dashboard/register"
                className="px-8 py-4 bg-[#c2cdff] text-black font-extrabold tracking-wide rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(194,205,255,0.3)] hover:shadow-[0_0_40px_rgba(194,205,255,0.6)]"
              >
                CREAR MI NEXO
              </Link>
              <Link
                href="/dashboard/login"
                className="px-8 py-4 bg-transparent border border-gray-800 text-white font-bold rounded-full hover:border-[#c2cdff]/50 hover:bg-[#c2cdff]/5 transition-all"
              >
                Entrar a mi cuenta
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 mb-32 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Diseño Minimalista"
            description="Interfaces ultra limpias y modo oscuro nativo que hacen resaltar lo que verdaderamente importa: tu contenido."
            icon="✨"
          />
          <FeatureCard
            title="Enlaces Inteligentes"
            description="Agrupa todos tus perfiles, tiendas y portafolios en un solo link dinámico y altamente personalizable."
            icon="🔗"
          />
          <FeatureCard
            title="Analíticas Neón"
            description="Mide el pulso de tu audiencia con métricas en tiempo real, clics y conversiones de tus enlaces."
            icon="📈"
          />
        </div>
      </section>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c2cdff] rounded-full blur-[150px] opacity-5 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00FFCC] rounded-full blur-[150px] opacity-5 mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <footer className="w-full text-center py-8 text-gray-700 text-xs font-bold tracking-[0.2em] relative z-10 border-t border-gray-900 mt-auto flex flex-col items-center gap-4">
        <div>{APP_NAME} © 2026 · STATE OF THE ART</div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Políticas de Privacidad</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Términos y Condiciones</Link>
          <Link href="/delete-account-instructions" className="hover:text-[#c2cdff] transition-colors">Instrucciones de Eliminación</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="group bg-[#0a0a0a] border border-gray-900 p-8 rounded-[2rem] hover:border-[#c2cdff]/40 transition-colors duration-500 relative overflow-hidden h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-[#c2cdff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="text-4xl mb-6 filter drop-shadow-[0_0_10px_rgba(194,205,255,0)] group-hover:drop-shadow-[0_0_15px_rgba(194,205,255,0.5)] transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-[#c2cdff] transition-colors duration-500">
        {title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed flex-1">
        {description}
      </p>
    </div>
  );
}
