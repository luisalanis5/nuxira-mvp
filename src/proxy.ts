import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const sessionToken = request.cookies.get('nuxira-session')?.value;
    const { pathname } = request.nextUrl;

    // 1. Entrar al Dashboard o Admin sin sesión -> Redirigir a Login
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/admin-dashboard');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if ((isDashboardRoute || isAdminRoute) && !pathname.includes('/login') && !pathname.includes('/register')) {
        if (!sessionToken) {
            return NextResponse.redirect(new URL('/dashboard/login', request.url));
        }
    }

    // 2. Intentar entrar a Login/Register teniendo sesión activa -> Redirigir a Dashboard
    if ((pathname === '/dashboard/login' || pathname === '/dashboard/register') && sessionToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Configurar en qué rutas se activará el middleware
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/admin-dashboard/:path*',
    ],
};
