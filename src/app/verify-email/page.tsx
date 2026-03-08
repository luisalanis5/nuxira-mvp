'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, User } from 'firebase/auth';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/config/brand';

export default function VerifyEmailPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const isIntentionalLogout = React.useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                if (!isIntentionalLogout.current) {
                    router.push('/dashboard/login');
                }
            } else if (currentUser.emailVerified) {
                router.push('/dashboard');
            } else {
                setUser(currentUser);
                setVerifying(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleResend = async () => {
        if (!user) return;
        setIsResending(true);
        try {
            const res = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, name: user.displayName || 'Creador' })
            });

            if (!res.ok) throw new Error('Error limit');

            toast.success('Correo de verificación reenviado. Revisa tu bandeja y SPAM.');
        } catch (error: any) {
            if (error.code === 'auth/too-many-requests') {
                toast.error('Has solicitado demasiados correos. Espera unos minutos.');
            } else {
                toast.error('Ocurrió un error. Intenta de nuevo.');
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleRefresh = async () => {
        if (!user) return;
        setVerifying(true);
        try {
            await user.reload();
            if (user.emailVerified) {
                toast.success('¡Correo verificado con éxito!');
                router.push('/onboarding');
            } else {
                toast.error('Aún no has verificado tu correo.');
            }
        } catch (error) {
            console.error('Error reloading user:', error);
        } finally {
            setVerifying(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-t-[#c2cdff] animate-spin border-gray-800"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-4">
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl text-center">
                <div className="w-16 h-16 bg-[#15151b] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800 text-3xl shadow-inner">
                    ✉️
                </div>
                <h1 className="text-2xl font-black text-white mb-4">Verifica tu correo</h1>
                <p className="text-sm text-gray-400 mb-8 bg-black/40 p-4 rounded-xl border border-gray-800/50 leading-relaxed">
                    Hemos enviado un enlace a <span className="text-[#00FFCC] font-bold">{user?.email}</span>.<br /><br />
                    Por favor, revisa tu bandeja de entrada y la <strong className="text-red-400">carpeta de SPAM</strong> o Promociones.<br /><br />
                    Si el correo es incorrecto o no existe, tu cuenta no podrá ser activada y será eliminada de nuestros servidores en 30 minutos por seguridad.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleRefresh}
                        disabled={verifying}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#c2cdff] to-[#00FFCC] text-black font-extrabold rounded-xl hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(0,255,204,0.3)] disabled:opacity-50"
                    >
                        Ya verifiqué mi correo
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="w-full py-3 px-4 bg-transparent border border-gray-700 text-gray-300 font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {isResending ? 'Enviando...' : 'Reenviar correo'}
                    </button>

                    <button
                        onClick={async () => {
                            isIntentionalLogout.current = true;
                            await auth.signOut();
                            router.push('/dashboard/register');
                        }}
                        className="text-gray-500 text-sm hover:text-white transition-colors underline pt-4 block w-full"
                    >
                        ¿Te equivocaste de correo? Regresar y crear cuenta de nuevo
                    </button>
                </div>
            </div>
        </div>
    );
}
