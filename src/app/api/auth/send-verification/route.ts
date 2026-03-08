import { NextResponse } from 'next/server';
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
            await resend.emails.send({
                from: 'Nuxira <onboarding@resend.dev>',
                to: email,
                subject: 'Verifica tu cuenta de Nuxira 🚀',
                react: VerificationEmail({ name: name || 'Creador', verificationLink }) as React.ReactElement
            });
        }

        console.log(`[EMAIL VERIFICATION API] 🚀 Correo de Validación enviado a: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully.'
        });
    } catch (error: any) {
        console.error('[EMAIL VERIFICATION API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
