import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: 'UID requerido' }, { status: 400 });
        }

        if (!adminDb) {
            throw new Error("Firebase admin database no está inicializada");
        }

        const creatorRef = adminDb.collection('creators').doc(uid);
        const creatorDoc = await creatorRef.get();

        if (!creatorDoc.exists) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        // Remove the stripeAccountId
        await creatorRef.update({
            stripeAccountId: null
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error desconectando de Stripe:', error);
        return NextResponse.json(
            { error: 'Error interno desconectando de Stripe', details: error.message },
            { status: 500 }
        );
    }
}
