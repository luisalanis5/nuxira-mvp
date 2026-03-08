import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function POST(req: Request) {
    try {
        const { moduleId, creatorId, price, title } = await req.json();

        if (!moduleId || !creatorId || !price) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        // 1. Obtener datos del Creador en Firestore
        if (!adminDb) {
            throw new Error("Firebase admin database no está inicializada");
        }
        const creatorRef = adminDb.collection('creators').doc(creatorId);
        const creatorDoc = await creatorRef.get();

        if (!creatorDoc.exists) {
            return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
        }

        const creatorData = creatorDoc.data();
        const stripeAccountId = creatorData?.stripeAccountId;

        // Guard 1: Creator has not started Stripe Connect at all
        if (!stripeAccountId) {
            return NextResponse.json({
                error: 'Este creador aún no tiene configurada su cuenta para recibir pagos. Inténtalo más tarde.'
            }, { status: 400 });
        }

        // Guard 2: Creator started onboarding but never finished it (details_submitted === false)
        if (!creatorData?.stripeSetupComplete) {
            return NextResponse.json({
                error: 'Este creador aún no ha terminado de configurar su cuenta bancaria. Inténtalo más tarde.'
            }, { status: 400 });
        }

        // El precio viene en pesos MXN ej: 100. Stripe procesa en centavos: 10000
        const amountInCents = Math.round(Number(price) * 100);

        // 2. Calcular la comisión de la Plataforma (15%)
        const applicationFeeAmount = Math.round(amountInCents * 0.15);

        // 3. Crear Checkout Session con split payment - wrapped in its own try/catch
        let session;
        try {
            session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            currency: 'mxn',
                            product_data: {
                                name: `Contenido Exclusivo: ${title || 'Módulo Premium'}`,
                                description: `Abono directo a ${creatorData?.username}`,
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
                metadata: {
                    type: 'locked_content_unlock',
                    moduleId: moduleId,
                    creatorId: creatorId
                },
                success_url: `${APP_URL}/${creatorData?.username}?unlock=${moduleId}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${APP_URL}/${creatorData?.username}`,
            });
        } catch (stripeError: any) {
            console.error('[checkout-locked] Stripe error:', stripeError?.message);
            // Catch the "missing required capabilities: transfers" Stripe error specifically
            if (
                stripeError?.type === 'StripeInvalidRequestError' ||
                stripeError?.code === 'account_invalid' ||
                stripeError?.message?.toLowerCase().includes('capabilit') ||
                stripeError?.message?.toLowerCase().includes('transfers')
            ) {
                return NextResponse.json({
                    error: 'Este creador aún no tiene configurada su cuenta para recibir pagos. Inténtalo más tarde.'
                }, { status: 400 });
            }
            throw stripeError; // Re-throw unexpected Stripe errors
        }

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Error generando checkout de Paywall:', error);
        return NextResponse.json(
            { error: 'Error procesando la solicitud', details: error.message },
            { status: 500 }
        );
    }
}
