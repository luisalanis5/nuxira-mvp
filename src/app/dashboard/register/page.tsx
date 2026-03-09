'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, twitterProvider } from '@/lib/firebase/client';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/config/brand';

const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Todo esto te llevará al Onboarding si tienes éxito en crear la cuenta en AUTH.
    // Será en /onboarding donde se creará tu perfil en la DB
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const idToken = await user.getIdToken();
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const userRef = doc(db, 'creators', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data()?.username) {
                toast.success("¡Bienvenido de vuelta!");
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        } catch (error) {
            console.error("❌ Error en autenticación:", error);
            setErrorMsg("Hubo un problema al registrarte con Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password) return;

        // Fase 2: Validación de Dominio de Email
        const emailRegex = /^[^\s@]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com|live\.com)$/i;
        if (!emailRegex.test(email)) {
            return toast.error("Por favor, usa un correo válido comercial (Gmail, Hotmail, Outlook, Yahoo, iCloud). No aceptamos correos temporales.");
        }

        // Fase 1: Seguridad de Contraseña
        if (password.length < 8 || password.length > 15) {
            return toast.error("La contraseña debe tener entre 8 y 15 caracteres.");
        }
        if (!/\d/.test(password)) {
            return toast.error("La contraseña debe incluir al menos un número.");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return toast.error("La contraseña debe incluir al menos un carácter especial.");
        }


        setIsLoading(true);
        setErrorMsg('');

        try {
            // Fase Smart Login: Verificar si ya existe en DB Creators
            const creatorsRef = collection(db, 'creators');
            const q = query(creatorsRef, where('email', '==', email.toLowerCase()));
            const snap = await getDocs(q);

            if (!snap.empty) {
                setIsLoading(false);
                return toast.error("Este correo ya está registrado en Nuxira. ¡Por favor, inicia sesión!");
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const idToken = await user.getIdToken();
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            // Paridad de datos: Actualizar perfil de Firebase con el nombre
            await updateProfile(user, { displayName: fullName });

            // Reemplazo FASE 5: Enviar email de verificación usando Resend
            try {
                await fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, name: fullName })
                });
            } catch (emailErr) {
                console.error("Error al disparar API de verificación:", emailErr);
            }

            toast.success("Cuenta creada. Por favor, revisa tu correo (y la carpeta de SPAM) para verificar tu cuenta.", { duration: 6000 });
            router.push('/verify-email'); // FASE 1: Redirigir a verify-email INMEDIATAMENTE
        } catch (error: any) {
            console.error("❌ Error register email:", error);
            // Fase 1: Manejo amigable de cuenta existente
            if (error.code === 'auth/email-already-in-use') {
                setErrorMsg("Esta cuenta ya está registrada. Por favor, ve a la pestaña de Iniciar Sesión.");
            } else {
                setErrorMsg(error.message || "No se pudo crear la cuenta.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            const idToken = await user.getIdToken();
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const userRef = doc(db, 'creators', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data()?.username) {
                toast.success('¡Bienvenido de vuelta!');
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        } catch (error: any) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                setErrorMsg('Ya existe una cuenta con este correo. Por favor, inicia sesión con el método que usaste originalmente (Ej. Google o Correo).');
            } else {
                setErrorMsg('Hubo un problema al registrarte con Facebook.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleXLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, twitterProvider);
            const user = result.user;

            const idToken = await user.getIdToken();
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const userRef = doc(db, 'creators', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data()?.username) {
                toast.success('¡Bienvenido de vuelta!');
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        } catch (error: any) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                setErrorMsg('Ya existe una cuenta con este correo. Por favor, inicia sesión con el método que usaste originalmente (Ej. Google o Correo).');
            } else {
                setErrorMsg('Hubo un problema al registrarte con X (Twitter).');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-4 selection:bg-[#00FFCC] selection:text-black">
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-2 text-center tracking-tighter uppercase">{APP_NAME}</h1>
                <p className="text-gray-400 mb-8 text-sm text-center">Crea tu cuenta de Creador</p>

                {/* Error Message Display */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
                        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-red-400 leading-snug">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleEmailRegister} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Ej. Juan Pérez"
                            className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2cdff] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            list="email-domains"
                            className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2cdff] transition-colors"
                        />
                        <datalist id="email-domains">
                            {email.includes('@') && !email.split('@')[1]?.includes('.') &&
                                EMAIL_DOMAINS.map(domain => (
                                    <option key={domain} value={`${email.split('@')[0]}@${domain}`} />
                                ))
                            }
                        </datalist>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Mín. 8 caracteres, 1 número y 1 símbolo"
                                className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2cdff] transition-colors pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? '👁️‍🗨️' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-[#c2cdff] to-[#00FFCC] text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,204,0.3)] transition-all disabled:opacity-50 mt-2"
                    >
                        {isLoading ? 'Creando...' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-900/60 text-gray-500">O crea tu cuenta con</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="group w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                        />
                        {isLoading ? 'Conectando...' : 'Google'}
                    </button>

                    {/* 
                    <button
                        type="button"
                        disabled
                        title="Próximamente"
                        className="group w-full py-3 px-4 bg-[#0a0a0e] text-gray-500 font-bold rounded-xl border border-gray-800 cursor-not-allowed flex items-center justify-center gap-3 opacity-50"
                    >
                        <svg className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                        Apple
                    </button>
                    */}

                    <button
                        type="button"
                        onClick={handleXLogin}
                        disabled={isLoading}
                        className="group w-full py-3 px-4 bg-black text-white font-bold rounded-xl border border-gray-800 hover:bg-gray-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.625L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        {isLoading ? 'Conectando...' : 'X (Twitter)'}
                    </button>

                    <button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={isLoading}
                        className="group w-full py-3 px-4 bg-[#1877F2] text-white font-bold rounded-xl hover:bg-[#166fe5] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5 filter brightness-0 invert" />
                        {isLoading ? 'Conectando...' : 'Facebook'}
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta? <a href="/dashboard/login" className="text-[#c2cdff] hover:underline">Inicia sesión</a>
                </p>
            </div>
        </div>
    );
}
