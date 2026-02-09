import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";
import { RedisRateLimiter } from "@/lib/security/redis-rate-limiter";

export default withAuth(
    function middleware(req: NextRequest) {
        const pathname = req.nextUrl.pathname;
        const method = req.method.toUpperCase();
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const response = NextResponse.next();
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        const api = pathname.startsWith('/api/');
        const isAuthRoute = pathname.startsWith('/api/auth');
        const isWebhook = pathname.startsWith('/api/payments/webhook');
        const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
        const windowMs = 60 * 1000;
        let limit = 100;
        if (isAuthRoute) limit = 20;
        if (pathname.startsWith('/api/payments')) limit = 50;
        RedisRateLimiter.check('global', limit, windowMs, String(ip)).then(allowed => {
            if (!allowed) {
                const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
                res.headers.set('Retry-After', '60');
                return res;
            }
        });
        if (process.env.NODE_ENV === 'production' && api && isMutating && !isAuthRoute && !isWebhook) {
            const csrfHeader = req.headers.get('x-csrf-token');
            const csrfCookie = req.cookies.get('csrfToken')?.value;
            if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
                return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
            }
        }
        if (!req.cookies.get('csrfToken')) {
            const r = NextResponse.next();
            r.cookies.set('csrfToken', Math.random().toString(36).slice(2), { httpOnly: false, sameSite: 'lax' });
            return r;
        }
        return response;
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        // Protect all APIs EXCEPT auth-related ones
        "/api/products/:path*",
        "/api/payments/:path*",
    ],
};
