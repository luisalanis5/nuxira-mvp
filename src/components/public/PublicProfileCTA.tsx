'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface PublicProfileCTAProps {
    appName: string;
    textColor: string;
    primaryColor: string;
}

export default function PublicProfileCTA({ appName, textColor, primaryColor }: PublicProfileCTAProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    // Evitar parpadeos de Auth
    if (isAuthenticated === null) {
        return (
            <div className="mt-16 mb-12 flex justify-center w-full opacity-50">
                <div className="w-32 h-12 rounded-full bg-white/10 animate-pulse"></div>
            </div>
        );
    }

    // Si ya tiene sesión, mostrar botón simple para retornar al dashboard
    if (isAuthenticated) {
        return (
            <div className="mt-16 mb-12 flex justify-center w-full">
                <Link
                    href="/dashboard"
                    className="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-black rounded-full transition-all duration-150 active:translate-y-1"
                    style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0px 4px 0px 0px ${primaryColor}80`
                    }}
                    onMouseDown={(e) => e.currentTarget.style.boxShadow = `0px 0px 0px 0px ${primaryColor}80`}
                    onMouseUp={(e) => e.currentTarget.style.boxShadow = `0px 4px 0px 0px ${primaryColor}80`}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0px 4px 0px 0px ${primaryColor}80`}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" rx="24" fill="#050505" />
                        <path d="M 24 72 L 24 28 L 48 72 L 48 28" stroke="#ffffff" strokeWidth="12" strokeLinejoin="miter" strokeLinecap="square" />
                        <path d="M 54 28 L 76 72 M 76 28 L 54 72" stroke={primaryColor} strokeWidth="12" strokeLinecap="square" />
                    </svg>
                    Ir a tu Centro de Mando
                </Link>
            </div>
        );
    }

    // Flujo Linktree-Style para visitantes no registrados
    return (
        <div className="mt-16 mb-12 flex flex-col items-center w-full relative">
            {!isMenuOpen ? (
                // Botón Cerrado Incial
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-black rounded-full transition-all duration-150 active:translate-y-1"
                    style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0px 4px 0px 0px ${primaryColor}80`
                    }}
                    onMouseDown={(e) => e.currentTarget.style.boxShadow = `0px 0px 0px 0px ${primaryColor}80`}
                    onMouseUp={(e) => e.currentTarget.style.boxShadow = `0px 4px 0px 0px ${primaryColor}80`}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0px 4px 0px 0px ${primaryColor}80`}
                >
                    <div className="flex items-center gap-3">
                        {/* Micro Logo SVG correcto format React */}
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100" height="100" rx="20" fill="#050505" />
                            <path d="M 28 72 L 28 30 L 52 72 L 52 30" stroke="#ffffff" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                            <path d="M 54 30 L 76 72 M 76 30 L 54 72" stroke={primaryColor} strokeWidth="10" strokeLinecap="square" />
                        </svg>
                        <span>⚡ Crea tu propio {appName}</span>
                    </div>
                </button>
            ) : (
                // Panel Modal Abierto (Overlay Fixed al fondo)
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm sm:mt-4 p-8 rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom-full duration-300 relative shadow-2xl"
                        style={{ backgroundColor: `${primaryColor}`, color: '#050505' }}>

                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors z-10 font-bold"
                        >
                            ✕
                        </button>

                        <h2 className="text-3xl font-black mb-3 leading-none tracking-tighter">
                            El futuro de tu marca personal.
                        </h2>

                        <h2 className="text-3xl font-black mb-4 leading-none tracking-tighter">
                            El futuro de tu marca personal.
                        </h2>

                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex items-start gap-3 bg-black/5 p-3 rounded-xl">
                                <div className="bg-black text-white p-1.5 rounded-lg mt-0.5">🚀</div>
                                <div className="text-sm font-medium opacity-90 leading-tight">
                                    <span className="font-bold block mb-1">Ecosistema Interactivo</span>
                                    Módulos dinámicos, encuestas, cofres secretos y tiendas. No más menús de links aburridos.
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-black/5 p-3 rounded-xl">
                                <div className="bg-black text-white p-1.5 rounded-lg mt-0.5">💰</div>
                                <div className="text-sm font-medium opacity-90 leading-tight">
                                    <span className="font-bold block mb-1">Monetización Híbrida</span>
                                    Recibe propinas directas, vende contenido exclusivo y muestra ads en piloto automático.
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/dashboard/register"
                            className="w-full bg-[#050505] text-white flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all hover:bg-black hover:scale-[1.02] active:scale-95 shadow-xl group"
                        >
                            <span>Comenzar mi universo ahora</span>
                            <svg className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>

                        <div className="mt-6 pt-4 border-t border-black/10 flex flex-col gap-2 text-xs font-bold items-center">
                            <Link href="/dashboard/login" className="hover:opacity-60 transition-opacity">Ya soy creador. Iniciar sesión</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
