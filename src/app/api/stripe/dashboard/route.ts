import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: Request) {
    try {
        const { accountId } = await req.json();

        if (!accountId) {
            return NextResponse.json({ error: 'Stripe Account ID requerido' }, { status: 400 });
        }

        // Generar enlace temporal de login al dashboard de Stripe Express
        const loginLink = await stripe.accounts.createLoginLink(accountId);

        return NextResponse.json({ url: loginLink.url });

    } catch (error: any) {
        console.error('Error generando Stripe Login Link:', error);
        return NextResponse.json(
            { error: 'Error conectando con Stripe', details: error.message },
            { status: 500 }
        );
    }
}
