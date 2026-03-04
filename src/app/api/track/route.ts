import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { APP_NAME } from '@/config/brand';

export async function POST(req: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Database no inicializada' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { username, moduleId, isGlobalAd } = body;

        if (!moduleId) {
            return NextResponse.json({ error: 'moduleId es requerido' }, { status: 400 });
        }

        // Lógica para Anuncios Globales de la Plataforma (Ad Engine)
        if (isGlobalAd) {
            const adRef = adminDb.collection('platform_ads').doc(moduleId);

            try {
                await adRef.update({
                    clicks: FieldValue.increment(1)
                });
                return NextResponse.json({ success: true, tracking: 'global_ad' });
            } catch (err) {
                // En caso de que el documento no exista o falle la actualización
                console.error("Error actualizando clic global:", err);
                return NextResponse.json({ error: 'Error trackeando anuncio global' }, { status: 500 });
            }
        }

        // Lógica para Links/Ads Locales del Creador
        if (!username) {
            return NextResponse.json({ error: 'Username es requerido para trackeo local' }, { status: 400 });
        }

        const snapshot = await adminDb
            .collection('creators')
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        const creatorDoc = snapshot.docs[0];
        const creatorRef = creatorDoc.ref;
        const data = creatorDoc.data();
        const modules = data.modules || [];

        // Encontrar el índice del módulo específico
        const moduleIndex = modules.findIndex((mod: any) => mod.id === moduleId);

        if (moduleIndex !== -1) {
            // Incrementar los clics en el módulo localmente
            const currentClicks = typeof modules[moduleIndex].clicks === 'number' ? modules[moduleIndex].clicks : 0;
            modules[moduleIndex].clicks = currentClicks + 1;

            // Actualizar el documento en Firestore
            await creatorRef.update({
                modules: modules
            });

            return NextResponse.json({ success: true, clicks: modules[moduleIndex].clicks });
        } else {
            return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
        }

    } catch (error) {
        console.error("Error en Tracking:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
