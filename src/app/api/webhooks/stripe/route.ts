import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2025-02-24.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        // En producción real, la firma debe coincidir con WEBHOOK_SECRET
        if (process.env.NODE_ENV === 'production' && webhookSecret !== 'whsec_dummy') {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } else {
            // Bypass para desarrollo local si no hay secreto válido
            event = JSON.parse(body) as Stripe.Event;
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Manejar el evento de checkout completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const creatorId = session.metadata?.creatorId;
            const type = session.metadata?.type;

            if (creatorId && type === 'tip') {
                if (!adminDb) {
                    console.error('adminDb no está inicializado');
                    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
                }
                // Registrar el pago en Firestore
                await adminDb.collection('payments').add({
                    creatorId: creatorId,
                    amount: session.amount_total,
                    currency: session.currency,
                    status: session.payment_status,
                    stripeSessionId: session.id,
                    createdAt: new Date(),
                    type: 'tip'
                });
                console.log(`Pago de ${session.amount_total} registrado para el creador ${creatorId}`);
            } else if (creatorId && type === 'locked_content_unlock') {
                const moduleId = session.metadata?.moduleId;
                if (!adminDb) {
                    console.error('adminDb no está inicializado');
                    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
                }

                // Registrar el pago del contenido bloqueado en Firestore
                await adminDb.collection('payments').add({
                    creatorId: creatorId,
                    moduleId: moduleId,
                    amount: session.amount_total,
                    currency: session.currency,
                    status: session.payment_status,
                    stripeSessionId: session.id,
                    createdAt: new Date(),
                    type: 'locked_content_unlock'
                });
                console.log(`Venta de módulo ${moduleId} para creador ${creatorId} registrada correctamente.`);
            }
        } catch (error) {
            console.error('Error guardando en Firestore desde Webhook:', error);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

export const dynamic = 'force-dynamic';
