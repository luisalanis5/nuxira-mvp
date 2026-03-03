import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, clearIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializa Firebase solo si no se ha hecho ya (vital para Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Configuración de Caché Offline (Solo Cliente)
let db: ReturnType<typeof getFirestore>;

if (typeof window !== 'undefined') {
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
    } catch (e: any) {
        // En caso de que ya estuviera inicializado o hubiera un error de IndexedDB
        db = getFirestore(app);

        // FIX: Error de Firestore "update time that is in the future"
        if (e.message && e.message.includes('future')) {
            console.warn("Limpiando caché de IndexedDB debido a un error de sincronización de tiempo...");
            clearIndexedDbPersistence(db).catch(() => { });
        }
    }
} else {
    db = getFirestore(app);
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
