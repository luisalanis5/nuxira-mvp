import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    if (!adminDb) return NextResponse.json({ error: 'DB no inicializada' }, { status: 500 });
    try {
        const body = await req.json();
        const { creatorId, postId, localUserId, isLiked } = body;

        if (!creatorId || !postId || !localUserId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

        const postRef = adminDb.collection('creators').doc(creatorId).collection('feed_posts').doc(postId);

        if (isLiked) {
            await postRef.update({ likedBy: FieldValue.arrayRemove(localUserId) });
        } else {
            await postRef.update({ likedBy: FieldValue.arrayUnion(localUserId) });

            // Trigger Notification for the creator
            const notifsRef = adminDb.collection('creators').doc(creatorId).collection('notifications');
            await notifsRef.add({
                type: 'like',
                message: 'A alguien le gustó tu publicación. ❤️',
                isRead: false,
                createdAt: FieldValue.serverTimestamp(),
                actionUrl: '/dashboard?tab=overview'
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error procesando el like' }, { status: 500 });
    }
}
