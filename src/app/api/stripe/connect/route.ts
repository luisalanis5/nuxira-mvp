import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
    try {
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: 'UID requerido' }, { status: 400 });
        }

        // 1. Verificar si el creador ya tiene una cuenta en Firestore
        if (!adminDb) {
            throw new Error("Firebase admin database no está inicializada");
        }
        const creatorRef = adminDb?.collection('creators').doc(uid);
        const creatorDoc = await creatorRef.get();

        if (!creatorDoc.exists) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        const creatorData = creatorDoc.data();
        let accountId = creatorData?.stripeAccountId;

        // 2. Si NO tiene cuenta, crear una nueva cuenta Express
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'MX', // Opcional: Podría venir del request
                email: creatorData?.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
            });

            accountId = account.id;

            // Guardar en Firestore
            await creatorRef.update({
                stripeAccountId: accountId
            });
        }

        // 3. Generar enlace de Onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${APP_URL}/dashboard?connect=refresh`,
            return_url: `${APP_URL}/dashboard?connect=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error: any) {
        console.error('Error en Stripe Connect:', error);
        return NextResponse.json(
            { error: 'Error interno conectando con Stripe', details: error.message },
            { status: 500 }
        );
    }
}
