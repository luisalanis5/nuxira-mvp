'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, twitterProvider } from '@/lib/firebase/client';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/config/brand';

const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    try {
      // 1. Iniciar sesión con Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Obtain ID Token for server session
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // 3. Revisar si el usuario ya completó su onboarding en Firestore
      const userRef = doc(db, 'creators', user.uid);
      const userSnap = await getDoc(userRef);

      // 3. Si es la primera vez que entra o no tiene perfil, al onboarding
      if (!userSnap.exists()) {
        router.push('/onboarding');
      } else {
        // 4. Si ya existe, al Centro de Mando
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      toast.error("Hubo un problema al iniciar sesión con Google.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Add server session
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // FASE 1: Redirección según estado
      if (!user.emailVerified) {
        router.push('/verify-email');
        return;
      }

      const userRef = doc(db, 'creators', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      // Fase 2: Manejo Dinámico de Colisión de Proveedores y Credenciales Inválidas
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPassword(''); // Limpiar contraseña por seguridad
        setErrorMsg('El correo o la contraseña son incorrectos. Si te registraste con Google, Facebook o X, usa esos botones para entrar.');

        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
            setErrorMsg("Parece que te registraste usando Google. Por favor, usa ese botón.");
            return;
          }
          if (methods.includes('facebook.com')) {
            setErrorMsg("Parece que te registraste usando Facebook. Por favor, usa ese botón.");
            return;
          }
          if (methods.includes('twitter.com')) {
            setErrorMsg("Parece que te registraste usando X (Twitter). Por favor, usa ese botón.");
            return;
          }
        } catch (err) {
          // Falla de red o de API silenciosa
        }
        return; // Detenemos aquí para no mostrar el error genérico
      }

      setErrorMsg(error.message || "Credenciales incorrectas.");
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
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Ya existe una cuenta con este correo. Por favor, inicia sesión con el método que usaste originalmente (Ej. Google o Correo).', { duration: 6000 });
      } else {
        toast.error('Hubo un problema al iniciar sesión con Facebook.');
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
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Ya existe una cuenta con este correo. Por favor, inicia sesión con el método que usaste originalmente (Ej. Google o Correo).', { duration: 6000 });
      } else {
        toast.error('Hubo un problema al iniciar sesión con X (Twitter).');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-4 selection:bg-[#00FFCC] selection:text-black">
      <div className="bg-gray-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2 text-center tracking-tighter uppercase">{APP_NAME}</h1>
        <p className="text-gray-400 mb-8 text-sm text-center">Accede a tu Centro de Mando</p>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-400 leading-snug">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              list="login-email-domains"
              className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2cdff] transition-colors"
            />
            <datalist id="login-email-domains">
              {email.includes('@') && !email.split('@')[1]?.includes('.') &&
                EMAIL_DOMAINS.map(domain => (
                  <option key={domain} value={`${email.split('@')[0]}@${domain}`} />
                ))
              }
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <div className="flex justify-end mt-2">
              <a href="/dashboard/forgot-password" className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#c2cdff] text-black font-bold rounded-xl hover:bg-[#aab8ff] transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900/60 text-gray-500">O continúa con</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="group w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            />
            Google
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
          ¿No tienes una cuenta? <a href="/dashboard/register" className="text-[#c2cdff] hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
}