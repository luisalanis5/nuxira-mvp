import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
    if (!adminAuth) {
        return NextResponse.json({ error: 'Auth not initialized' }, { status: 500 });
    }

    try {
        const { idToken } = await req.json();

        // Expire session in 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json({ success: true });

        // Set secure cookie
        response.cookies.set('nuxira-session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('[AUTH_SESSION] Error creating session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('nuxira-session');
    return response;
}
