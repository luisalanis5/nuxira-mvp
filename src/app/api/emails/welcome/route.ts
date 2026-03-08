import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // FASE 3: Cascarón preparado para enviar correo de bienvenida.
        // Aquí puedes integrar Resend, Nodemailer o Postmark fácilmente.
        // Ejemplo con Resend:
        // await resend.emails.send({
        //     from: 'Nuxira <hola@nuxira.app>',
        //     to: email,
        //     subject: '¡Bienvenido a tu nuevo multiverso digital! 🚀',
        //     html: `<p>Hola ${name}, bienvenido a Nuxira...</p>`
        // });

        console.log(`[EMAIL TRANSACTIONS API] 🚀 Correo de Bienvenida encolado para: ${name || 'Creador'} <${email}>`);

        return NextResponse.json({
            success: true,
            message: 'Welcome email simulation successful.',
            deliveredTo: email
        });
    } catch (error: any) {
        console.error('[EMAIL TRANSACTIONS API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
