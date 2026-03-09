import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ─── IMPORTANT: Disable Next.js body parsing so we get the raw body for signature verification ───
export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !webhookSecret) {
        console.error('[webhook] Missing signature or webhook secret');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error('[webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (!adminDb) {
        console.error('[webhook] Firebase Admin not initialized');
        return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });
    }

    console.log(`[webhook] Received event: ${event.type}`);

    try {
        switch (event.type) {

            // ══════════════════════════════════════════════════════════════════
            // PREMIUM SUBSCRIPTION — ACTIVATION
            // Fired when a creator completes the Premium checkout for the first time.
            // payload: session.client_reference_id = creator UID
            // ══════════════════════════════════════════════════════════════════
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription') {
                    // --- Premium subscription purchase ---
                    const uid = session.client_reference_id;
                    if (!uid) {
                        console.warn('[webhook] checkout.session.completed (subscription): no client_reference_id');
                        break;
                    }
                    await adminDb.collection('creators').doc(uid).update({
                        isPremium: true,
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: session.subscription as string,
                        premiumActivatedAt: new Date().toISOString(),
                    });

                    // Trigger Notification
                    await adminDb.collection('creators').doc(uid).collection('notifications').add({
                        type: 'system',
                        message: '¡Tu cuenta ha sido actualizada a Premium! ✨ Disfruta de todos los beneficios.',
                        isRead: false,
                        createdAt: FieldValue.serverTimestamp(),
                        actionUrl: '/dashboard'
                    });

                    console.log(`[webhook] ✅ Creator ${uid} upgraded to Premium`);

                } else if (session.mode === 'payment') {
                    // --- Paywall one-time unlock ---
                    const { moduleId, creatorId } = session.metadata as { moduleId: string; creatorId: string };
                    const buyerEmail = session.customer_details?.email;
                    // We store unlocks keyed by session ID so they're idempotent
                    const sessionId = session.id;

                    if (!moduleId || !creatorId) {
                        console.warn('[webhook] checkout.session.completed (payment): missing metadata');
                        break;
                    }

                    // Write to: creators/{creatorId}/unlocked_modules/{sessionId}
                    await adminDb
                        .collection('creators')
                        .doc(creatorId)
                        .collection('unlocked_modules')
                        .doc(sessionId)
                        .set({
                            moduleId,
                            creatorId,
                            buyerEmail: buyerEmail || null,
                            unlockedAt: new Date().toISOString(),
                            sessionId,
                        });

                    // Trigger Notification for the creator
                    await adminDb.collection('creators').doc(creatorId).collection('notifications').add({
                        type: 'payment',
                        message: `¡Has recibido un nuevo pago! 💰 Un usuario ha desbloqueado un módulo (${buyerEmail || 'Anónimo'}).`,
                        isRead: false,
                        createdAt: FieldValue.serverTimestamp(),
                        actionUrl: '/dashboard?tab=payments'
                    });

                    console.log(`[webhook] 🔓 Module ${moduleId} unlocked for ${buyerEmail} (session: ${sessionId})`);
                }
                break;
            }

            // ══════════════════════════════════════════════════════════════════
            // PREMIUM SUBSCRIPTION — PAYMENT FAILED (month 2+)
            // Fired when the monthly charge fails (e.g. expired card).
            // payload: subscription.metadata is NOT reliable here; use customer ID.
            // ══════════════════════════════════════════════════════════════════
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                if (!customerId) break;

                // Find the creator by stripeCustomerId
                const snap = await adminDb
                    .collection('creators')
                    .where('stripeCustomerId', '==', customerId)
                    .limit(1)
                    .get();

                if (!snap.empty) {
                    const creatorRef = snap.docs[0].ref;
                    await creatorRef.update({ isPremium: false });
                    console.log(`[webhook] ❌ invoice.payment_failed — removed Premium for customer ${customerId}`);
                } else {
                    console.warn(`[webhook] invoice.payment_failed — creator not found for customer ${customerId}`);
                }
                break;
            }

            // ══════════════════════════════════════════════════════════════════
            // PREMIUM SUBSCRIPTION — CANCELLED (user manually cancels or refund)
            // Fired when a subscription ends permanently.
            // ══════════════════════════════════════════════════════════════════
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                if (!customerId) break;

                const snap = await adminDb
                    .collection('creators')
                    .where('stripeCustomerId', '==', customerId)
                    .limit(1)
                    .get();

                if (!snap.empty) {
                    const creatorRef = snap.docs[0].ref;
                    await creatorRef.update({
                        isPremium: false,
                        stripeSubscriptionId: null,
                    });
                    console.log(`[webhook] ❌ Subscription deleted — removed Premium for customer ${customerId}`);
                } else {
                    console.warn(`[webhook] customer.subscription.deleted — creator not found for customer ${customerId}`);
                }
                break;
            }

            default:
                // Silently ignore unhandled events
                console.log(`[webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[webhook] Internal error processing event:', err);
        return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 });
    }
}
