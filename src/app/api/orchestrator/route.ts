import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { APP_NAME } from '@/config/brand';

export async function POST(req: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Database no inicializada' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { username, fanContext } = body;

        if (!username) {
            return NextResponse.json({ error: 'Username es requerido' }, { status: 400 });
        }

        // 1. Obtener datos del creador desde Firestore
        const snapshot = await adminDb
            .collection('creators')
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        const creatorData = snapshot.docs[0].data();

        // 2. SYSTEM_PROMPT y Lógica del Orquestador (Mock)
        // En producción, aquí harías fetch a OpenAI o Gemini enviando creatorData y fanContext
        /*
          SYSTEM_PROMPT: `Eres el Orquestador de la plataforma ${APP_NAME}. 
          Tu misión es estructurar el perfil del creador dependiendo de quién lo visite 
          para maximizar retención y monetización. 
          Devuelve un array de objetos con el tipo de componente a renderizar y sus props.`
        */

        // 3. Crear el LAYOUT mockeado cumpliendo la restricción del usuario:
        // 1. Q&A, 2. Anuncio Nativo, 3. Links tradicionales
        const layout = [
            {
                type: 'qna',
                id: 'qna_1',
                props: {
                    title: `¡Pregúntale a ${creatorData.profile?.displayName || username}!`,
                    placeholder: 'Hazme una pregunta anónima...',
                }
            },
            {
                type: 'nativeAd',
                id: 'ad_1',
                props: {
                    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
                    title: 'Domina Next.js 15',
                    description: `Aprende a construir apps asombrosas como ${APP_NAME}.`,
                    ctaText: 'Ver curso',
                    url: 'https://nextjs.org'
                }
            },
            {
                type: 'links',
                id: 'links_1',
                props: {
                    modules: creatorData.modules || [],
                    theme: creatorData.theme || { primaryColor: '#00FFCC' }
                }
            }
        ];

        return NextResponse.json({ layout });
    } catch (error) {
        console.error("Error en Orquestador:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
