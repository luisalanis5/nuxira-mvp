import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export interface CreatorProfile {
    uid: string;
    email: string;
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    authProvider: string;
    plan: string;
    isVerified: boolean;
    isPremium?: boolean;
    hasSeenWelcomeModal: boolean;
    modules: any[];
    theme: {
        primaryColor: string;
        mode: string;
        buttonStyle: string;
        fontFamily: string;
        activeSkin: string;
        fontMode?: string;
        videoBgUrl?: string;
        audioBgUrl?: string;
        backgroundImage?: string;
    };
    stripeAccountId?: string;
    stripeSetupComplete?: boolean;
    createdAt: any;
    lastLogin: any;
}

/**
 * Función heurística para detectar género por nombre y generar Avatar (Dicebear Avataaars)
 */
export function getSmartAvatar(name: string, fallbackSeed: string): string {
    const cleanName = (name || fallbackSeed).toLowerCase().trim().split(' ')[0].replace(/[^a-zñáéíóú]/g, '');

    // Fallback absoluto
    if (!cleanName) return `https://api.dicebear.com/7.x/initials/svg?seed=${fallbackSeed}`;

    // Listas de excepciones en español/inglés comunes
    const maleExceptions = ['luca', 'tomas', 'matias', 'elias', 'jose', 'luis', 'carlos', 'jesus', 'juan', 'andres', 'david', 'manuel', 'jorge'];
    const femaleExceptions = ['carmen', 'beatriz', 'luz', 'paz', 'isabel', 'raquel', 'ester', 'ruth', 'noemi', 'miriam', 'sol', 'cruz'];

    let isFemale = false;

    if (femaleExceptions.includes(cleanName)) {
        isFemale = true;
    } else if (maleExceptions.includes(cleanName)) {
        isFemale = false;
    } else if (cleanName.endsWith('a') || cleanName.endsWith('z')) {
        // En español, la gran mayoría de nombres terminados en 'a' son femeninos, y terminados en 'o' u otra consonante masculinos.
        isFemale = true;
    }

    // Parámetros específicos de Dicebear para Avataaars v7 (rasgos femeninos o masculinos estéticamente agradables)
    const genderParams = isFemale
        ? "clothing=blazerAndSweater,collarAndSweater,graphicShirt,hoodie,overall,shirtScoopNeck,shirtVNeck&eyebrows=defaultNatural,flatNatural,raisedExcitedNatural,upDownNatural&eyes=default,happy,squint,wink&facialHairProbability=0&hair=bun,curly,curvy,dreads01,frida,longButNotTooLong,miaWallace,shaggy,straight01,straight02&mouth=default,smile,twinkle&skinColor=edb98a,fd9841,f8d25c,ffdbb4"
        : "clothing=blazerAndShirt,blazerAndSweater,hoodie,shirtCrewNeck,shirtVNeck&eyebrows=default,defaultNatural,flatNatural,raisedExcited,upDownNatural&eyes=default,happy,squint,wink&facialHair=beardLight,beardMagestic,beardMedium,moustaceMagnum&facialHairProbability=20&hair=dreads,dreads01,dreads02,frizzle,shaggy,shortCurly,shortFlat,shortRound,shortWaved,sides,theCaesar&mouth=default,smile,twinkle&skinColor=edb98a,fd9841,f8d25c,ffdbb4";

    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}&${genderParams}`;
}

/**
 * Inicializa el perfil base de un creador en Firestore tras registrarse
 * Crea el único documento necesario en la colección `creators`.
 */
export async function createInitialProfile(uid: string, email: string, username: string, authProvider: string = 'password', displayNameFallback?: string) {
    if (!uid || !email || !username) {
        throw new Error("Missing required fields for profile creation");
    }

    try {
        const creatorRef = doc(db, 'creators', uid);
        const finalDisplayName = displayNameFallback || username;

        const newProfile: CreatorProfile = {
            uid,
            email,
            username: username.toLowerCase(),
            displayName: finalDisplayName,
            bio: 'Bienvenido a mi Nuxira. Aquí encontrarás todos mis enlaces centralizados.',
            avatarUrl: getSmartAvatar(finalDisplayName, username),
            authProvider,
            plan: 'free',
            isVerified: false,
            hasSeenWelcomeModal: false,
            modules: [],
            theme: {
                primaryColor: '#c2cdff',
                mode: 'dark',
                buttonStyle: 'rounded',
                fontFamily: 'Inter',
                activeSkin: 'default'
            },
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        await setDoc(creatorRef, newProfile);

        // TAREA 2: Trigger del correo de bienvenida por Resend
        try {
            await fetch('/api/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name: username })
            });
        } catch (apiErr) {
            console.error("Error trigger welcome API:", apiErr);
        }

        console.log(`[Nuxira DB] Initialized documents for creator: ${username}`);
        return true;
    } catch (error) {
        console.error("[Nuxira DB] Error creating initial profile:", error);
        throw error;
    }
}

/**
 * Verifica si un username ya está en uso en Firestore
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username) return false;

    try {
        const profilesRef = collection(db, 'creators');
        const q = query(profilesRef, where("username", "==", username.toLowerCase()));
        const snapshot = await getDocs(q);

        // Si el snapshot está vacío, el username está disponible
        return snapshot.empty;
    } catch (error) {
        console.error("[Nuxira DB] Error checking username availability:", error);
        throw error;
    }
}
