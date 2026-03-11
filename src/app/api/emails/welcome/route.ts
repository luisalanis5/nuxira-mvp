import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (process.env.RESEND_API_KEY) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Equipo Nuxira <hola@nuxira.me>',
                    to: email,
                    subject: '¡Bienvenido a tu nuevo multiverso digital! 🚀',
                    react: WelcomeEmail({ name: name || 'Creador' }) as any
                });

                if (error) {
                    console.error('[EMAIL TRANSACTIONS API] Resend error:', error);
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }
            } catch (err: any) {
                console.error('[EMAIL TRANSACTIONS API] Fallo crítico al enviar correo con Resend:', err);
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
        }

        console.log(`[EMAIL TRANSACTIONS API] 🚀 Correo de Bienvenida enviado a: ${name || 'Creador'} <${email}>`);

        return NextResponse.json({
            success: true,
            message: 'Welcome email sent successfully.',
            deliveredTo: email
        });
    } catch (error: any) {
        console.error('[EMAIL TRANSACTIONS API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
