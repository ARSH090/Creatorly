import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Check for auth token in cookies (set by client SDK)
    const authToken = req.cookies.get('authToken')?.value;

    // Protected routes pattern
    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/onboarding');

    // Auth routes pattern
    const isAuthRoute = pathname.startsWith('/auth');

    // 1. Redirect to login if accessing protected route without token
    if (isProtectedRoute && !authToken) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 2. Redirect to dashboard if accessing auth pages while logged in
    if (isAuthRoute && authToken) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 3. Security Headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 4. CSRF Protection for mutating API requests
    const isApi = pathname.startsWith('/api/');
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isWebhook = pathname.startsWith('/api/payments/webhook');

    if (process.env.NODE_ENV === 'production' && isApi && isMutating && !isWebhook) {
        // Skip CSRF for webhooks (already verified via signature)
        const isPaymentWebhook = pathname.startsWith('/api/payments/razorpay/webhook');

        if (!isPaymentWebhook && !pathname.startsWith('/api/auth')) {
            const csrfHeader = req.headers.get('x-csrf-token');
            const csrfCookie = req.cookies.get('csrfToken')?.value;
            if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
                return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
            }
        }
    }

    // Set CSRF cookie if missing
    response.cookies.set('csrfToken', Math.random().toString(36).slice(2), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
    });

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/onboarding/:path*",
        "/auth/:path*",
        "/api/:path*",
    ],
};
