'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/config/brand';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);

        try {
            // Fase 2: Intentar detectar si el usuario usa un proveedor social
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods.includes('google.com') || methods.includes('facebook.com') || methods.includes('twitter.com')) {
                    toast.error("Este correo pertenece a una cuenta social integrada (Google/X/Facebook). No necesitas contraseña, inicia sesión directamente desde el botón.");
                    setIsLoading(false);
                    return;
                }
            } catch (err) { }

            await sendPasswordResetEmail(auth, email);
            setIsSent(true);
            toast.success("Enlace de recuperación enviado.");
        } catch (error: any) {
            console.error("❌ Error reset password:", error);
            toast.error(error.message || "No se pudo enviar el correo de recuperación.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-4 selection:bg-[#00FFCC] selection:text-black">
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-2 text-center tracking-tighter uppercase">{APP_NAME}</h1>

                {!isSent ? (
                    <>
                        <p className="text-gray-400 mb-8 text-sm text-center">Recupera el acceso a tu cuenta</p>
                        <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tucorreo@ejemplo.com"
                                    className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2cdff] transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-[#c2cdff] to-[#00FFCC] text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,204,0.3)] transition-all disabled:opacity-50 mt-2"
                            >
                                {isLoading ? 'Enviando...' : 'Enviar Enlace Mágico'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <span className="text-5xl block mb-4">✉️</span>
                        <h2 className="text-xl font-bold mb-2">Revisa tu bandeja</h2>
                        <p className="text-sm text-gray-400 mb-6">Hemos enviado instrucciones para cambiar tu contraseña a <b>{email}</b>.</p>
                    </div>
                )}

                <div className="mt-8 text-center text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">
                    <Link href="/dashboard/login" className="text-white flex items-center justify-center gap-2">← Volver al login</Link>
                </div>
            </div>
        </div>
    );
}
