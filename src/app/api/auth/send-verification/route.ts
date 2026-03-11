import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { adminAuth } from '@/lib/firebase/admin';
import { VerificationEmail } from '@/emails/VerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Generate the custom verification link using Firebase Admin SDK
        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const verificationLink = await adminAuth.generateEmailVerificationLink(email);

        if (process.env.RESEND_API_KEY) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Equipo Nuxira <hola@nuxira.me>',
                    to: email,
                    subject: 'Verifica tu cuenta de Nuxira 🚀',
                    html: await render(VerificationEmail({ name: name || 'Creador', verificationLink }) as React.ReactElement)
                });

                if (error) {
                    console.error('[EMAIL VERIFICATION API] Resend error:', error);
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }
            } catch (err: any) {
                console.error('[EMAIL VERIFICATION API] Fallo crítico al enviar correo con Resend:', err);
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
        }

        console.log(`[EMAIL VERIFICATION API] 🚀 Correo de Validación enviado a: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully.'
        });
    } catch (error: any) {
        console.error('[EMAIL VERIFICATION API] Error:', error);
        if (error.message?.includes('TOO_MANY_ATTEMPTS')) {
            return NextResponse.json({ error: 'Has solicitado demasiados correos. Por favor, espera unos minutos antes de intentar de nuevo.' }, { status: 429 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
