import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
    try {
        const { moduleId, creatorId, price, title } = await req.json();

        if (!moduleId || !creatorId || !price) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        // 1. Obtener la cuenta Express del Creador
        if (!adminDb) {
            throw new Error("Firebase admin database no está inicializada");
        }
        const creatorRef = adminDb.collection('creators').doc(creatorId);
        const creatorDoc = await creatorRef.get();

        if (!creatorDoc.exists) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        const stripeAccountId = creatorDoc.data()?.stripeAccountId;

        if (!stripeAccountId) {
            return NextResponse.json({ error: 'El creador no tiene Stripe Connect habilitado.' }, { status: 403 });
        }

        // El precio viene en pesos MXN ej: 100. Stripe procesa en centavos: 10000
        const amountInCents = Math.round(Number(price) * 100);

        // 2. Calcular la comisión de la Plataforma (15%)
        const applicationFeeAmount = Math.round(amountInCents * 0.15);

        // 3. Crear Checkout Session de Venta Directa (Split Payment)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: `Contenido Exclusivo: ${title || 'Módulo Premium'}`,
                            description: `Abono directo a ${creatorDoc.data()?.username}`,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                application_fee_amount: applicationFeeAmount,
                transfer_data: {
                    destination: stripeAccountId,
                },
            },
            // Pasamos metadata para que el webhook sepa qué se compró
            metadata: {
                type: 'locked_content_unlock',
                moduleId: moduleId,
                creatorId: creatorId
            },
            success_url: `${APP_URL}/${creatorDoc.data()?.username}?unlock=${moduleId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/${creatorDoc.data()?.username}`,
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Error generando checkout de Paywall:', error);
        return NextResponse.json(
            { error: 'Error procesando la solicitud', details: error.message },
            { status: 500 }
        );
    }
}
