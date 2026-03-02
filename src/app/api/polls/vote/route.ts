import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    if (!adminDb) return NextResponse.json({ error: 'DB no inicializada' }, { status: 500 });
    try {
        const body = await req.json();
        const { creatorId, moduleId, optionIndex } = body;

        if (!creatorId || !moduleId || optionIndex === undefined) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const pollRef = adminDb.collection('creators').doc(creatorId).collection('modules').doc(moduleId);

        await adminDb.runTransaction(async (transaction) => {
            const pollDoc = await transaction.get(pollRef);
            if (!pollDoc.exists) throw new Error("El módulo no existe.");

            const data = pollDoc.data();
            const props = data?.props || {};
            const results = props.results || {};

            results[optionIndex] = (results[optionIndex] || 0) + 1;

            transaction.update(pollRef, {
                'props.results': results,
                'props.totalVotes': (props.totalVotes || 0) + 1
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error procesando el voto' }, { status: 500 });
    }
}
