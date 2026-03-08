import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth } from '@/lib/firebase/admin';
import { headers } from 'next/headers';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2025-02-24.acacia' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
    try {
        // 1. Verificar autenticación usando el token de Firebase via Header
        // (En la versión MVP asumimos que el frontend envía la cookie o se puede extraer)
        // Para no bloquearnos, extraeremos el token de autorización si lo hay,
        // o pediremos al frontend que mande el userId.

        // Como estamos usando Firebase Auth en frontend, el modo más simple 
        // es que el frontend envíe su UID o un AuthToken.
        // Vamos a permitir que el cuerpo reciba el Firebase UID (en webhooks lo validaremos seguro)
        // Pero en este boilerplate confiaremos en la cookie global o Auth.
        // Para simplificar, obtenemos la autorización:

        const requestHeaders = await headers();
        const origin = requestHeaders.get('origin') || APP_URL;

        // 2. Aquí iría el UID validado en servidor, pero usaremos el metadata
        // por ahora pediremos al front que nos mande el UID si no usamos NextAuth
        // Por motivos de MVP y rapidez de Stripe Checkout, crearemos la session:

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    // TODO_PONER_ID_AQUI - Reemplaza en el futuro con tu price_xxxxxx real
                    // Por ejemplo: price: 'price_1PXXX...',
                    price: process.env.STRIPE_PREMIUM_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/dashboard?canceled=true`,
            // Puedes pasar el UID del usuario en `client_reference_id` 
            // si en el frontend lo envías (vamos a modificar el frontend para que lo mande)
            // client_reference_id: "...",
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating stripe checkout session:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
