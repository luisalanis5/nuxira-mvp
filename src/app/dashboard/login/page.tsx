'use client';

import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      // 1. Iniciar sesión con Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Revisar si el usuario ya existe en Firestore
      const userRef = doc(db, 'creators', user.uid);
      const userSnap = await getDoc(userRef);

      // 3. Si es la primera vez que entra, le creamos su perfil
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          // Usamos la primera parte de su correo como username por defecto
          username: user.email?.split('@')[0] || user.uid,
          profile: {
            displayName: user.displayName || 'Gamer Pro',
            bio: 'Estudiante de ingeniería creando cosas increíbles.',
            avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          },
          modules: [],
          theme: { primaryColor: '#00FFCC', mode: 'dark' },
          createdAt: new Date().toISOString()
        });
      }

      // 4. Redirigir al Centro de Mando
      router.push('/dashboard');
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      toast.error("Hubo un problema al iniciar sesión. Revisa la consola.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-4 selection:bg-[#00FFCC] selection:text-black">
      <div className="bg-gray-900/60 backdrop-blur-xl p-10 rounded-3xl border border-gray-800 text-center max-w-sm w-full shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">NEXIA</h1>
        <p className="text-gray-400 mb-10 text-sm">Tu Centro de Mando</p>

        <button
          onClick={handleGoogleLogin}
          className="group w-full py-4 px-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6 group-hover:scale-110 transition-transform"
          />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}