'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { createInitialProfile, checkUsernameAvailability } from '@/lib/firebase/profileUtils';
import NuxiraLogo from '@/components/ui/NuxiraLogo';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const [username, setUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const isPasswordAuth = currentUser.providerData.some(p => p.providerId === 'password');
                if (isPasswordAuth && !currentUser.emailVerified) {
                    router.push('/verify-email');
                } else {
                    setUser(currentUser);
                }
            } else {
                router.push('/dashboard/login');
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);

    // Debounce para checar disponibilidad del username
    useEffect(() => {
        if (!username) {
            setIsAvailable(null);
            return;
        }

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (cleanUsername !== username) {
            setUsername(cleanUsername);
            return;
        }

        if (cleanUsername.length < 3) {
            setIsAvailable(false);
            return;
        }

        setIsChecking(true);
        const timer = setTimeout(async () => {
            try {
                const available = await checkUsernameAvailability(cleanUsername);
                setIsAvailable(available);
            } catch (err) {
                console.error("Error checking username:", err);
                setIsAvailable(false); // Seguro en caso de error
            } finally {
                setIsChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleCompleteOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !username || isAvailable !== true) return;

        setIsSubmitting(true);

        try {
            // Detect auth provider
            const providerId = user.providerData && user.providerData.length > 0
                ? user.providerData[0].providerId
                : 'password';

            // Force reload to get updated profile info (displayName) from FirebaseAuth 
            // since it was updated right before email verification
            await user.reload();
            const refreshedUser = auth.currentUser;

            // Auto-fill displayName if OAuth, fallback to username
            const displayName = refreshedUser?.displayName || user.displayName || username;

            await createInitialProfile(user.uid, user.email!, username, providerId, displayName);

            toast.success("¡Bienvenido a Nuxira!");
            router.push('/dashboard');

        } catch (error: any) {
            console.error("Error en el onboarding:", error);
            toast.error("Hubo un error configurando tu cuenta. Intenta de nuevo.");
            setIsSubmitting(false);
        }
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-t-[#c2cdff] animate-spin border-gray-800"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-[#c2cdff]/30 selection:text-white relative overflow-hidden">
            {/* Glow de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c2cdff] rounded-full blur-[150px] opacity-10 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex justify-center mb-10">
                    <div className="w-16 h-16 relative">
                        {/* Glow detrás del logo */}
                        <div className="absolute inset-0 bg-[#c2cdff] blur-[20px] opacity-50 rounded-full" />
                        <NuxiraLogo className="relative z-10 filter drop-shadow-[0_0_10px_rgba(194,205,255,0.6)]" variant="glow" />
                    </div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                        Crea tu enlace
                    </h1>
                    <p className="text-gray-400 text-center mb-8 text-sm">
                        Ésta será tu única url (nuxira.me/tualias). Elige bien, será tu nexo con el mundo.
                    </p>

                    <form onSubmit={handleCompleteOnboarding} className="space-y-6">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                RECLAMA TU URL
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-500 font-medium">
                                    {process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="tunombre"
                                    disabled={isSubmitting}
                                    className={`w-full bg-[#050505] border border-white/10 rounded-xl pl-[92px] pr-12 py-4 text-white font-medium focus:outline-none focus:ring-1 transition-all
                                        ${isAvailable === true ? 'focus:border-[#c2cdff] focus:ring-[#c2cdff] border-[#c2cdff]/50' : ''}
                                        ${isAvailable === false && username.length > 2 ? 'focus:border-red-500 focus:ring-red-500 border-red-500/50' : 'focus:border-white/30 focus:ring-white/30'}
                                    `}
                                />
                                <div className="absolute right-4 flex items-center justify-center">
                                    {isChecking && (
                                        <div className="w-5 h-5 rounded-full border-2 border-t-gray-400 animate-spin border-gray-700" />
                                    )}
                                    {!isChecking && isAvailable === true && username && (
                                        <svg className="w-6 h-6 text-[#c2cdff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {!isChecking && isAvailable === false && username.length > 2 && (
                                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Validation Messages */}
                            <div className="h-6 mt-1 flex items-center">
                                {!isChecking && isAvailable === true && username && (
                                    <span className="text-xs text-[#c2cdff]">✅ ¡Disponible!</span>
                                )}
                                {!isChecking && isAvailable === false && username.length > 2 && (
                                    <span className="text-xs text-red-400">❌ Nombre ocupado</span>
                                )}
                                {username.length > 0 && username.length < 3 && (
                                    <span className="text-xs text-gray-500">Mínimo 3 caracteres.</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || isAvailable !== true || isChecking}
                            className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-[#c2cdff] to-[#00FFCC] text-black font-extrabold rounded-xl hover:shadow-[0_0_20px_rgba(194,205,255,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Configurando tu Nexo...
                                </>
                            ) : (
                                'Continuar al Dashboard →'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
