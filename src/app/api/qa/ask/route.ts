import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    if (!adminDb) return NextResponse.json({ error: 'DB no inicializada' }, { status: 500 });
    try {
        const body = await req.json();
        const { creatorId, content } = body;

        if (!creatorId || !content) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

        const questionsRef = adminDb.collection('questions');
        await questionsRef.add({
            receiverId: creatorId,
            content: content.trim(),
            isAnswered: false,
            createdAt: FieldValue.serverTimestamp()
        });

        // Trigger Notification
        const notifsRef = adminDb.collection('creators').doc(creatorId).collection('notifications');
        await notifsRef.add({
            type: 'question',
            message: 'Alguien te ha dejado una nueva pregunta anónima.',
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            actionUrl: '/dashboard?tab=interaction'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error procesando la pregunta' }, { status: 500 });
    }
}

