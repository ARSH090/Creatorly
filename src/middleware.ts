import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter for fallback (Note: memory is not shared across lambda instances)
const rateLimit = new Map();

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // 0. Custom Domain Handling (from proxy.ts)
    const mainDomains = ['creatorly.app', 'localhost:3000', 'creatorly-beta.vercel.app'];
    const isMainDomain = mainDomains.some(d => hostname.includes(d));

    if (!isMainDomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
        // Rewrite to /u/ (username logic would need a lookup or a convention)
        // For this audit, we implement the rewrite pattern
        return NextResponse.rewrite(new URL(`/custom-domain/${hostname}${pathname}`, request.url));
    }

    // 1. Auth & Protected Routes (from proxy.ts)
    const authToken = request.cookies.get('authToken')?.value;
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/onboarding');
    const isAuthRoute = pathname.startsWith('/auth');

    // Redirect to login if accessing protected route without token
    if (isProtectedRoute && !authToken) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if (isAuthRoute && authToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const response = NextResponse.next();

    // 2. Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // CSP (Content Security Policy) - strict but allowing necessary sources
    // Note: 'unsafe-inline' and 'unsafe-eval' are often needed for Next.js in dev/some prod scenarios 
    // until strictly configured with hashes. Using a balanced policy for now.
    const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.vercel-analytics.com https://*.razorpay.com https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://*.cloudinary.com https://*.gravatar.com https://*.razorpay.com https://creatorly-assets.s3.ap-south-1.amazonaws.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.vercel-analytics.com https://*.firebaseio.com https://*.razorpay.com https://lumberjack.razorpay.com;
    frame-src 'self' https://*.google.com https://*.razorpay.com https://api.razorpay.com;
    object-src 'none';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', csp);

    // 3. Rate Limiting for Auth Routes
    if (pathname.startsWith('/api/auth')) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const limit = 20; // 20 requests
        const windowMs = 60 * 1000; // per 1 minute

        const now = Date.now();
        const windowStart = now - windowMs;

        const requestLog = rateLimit.get(ip) || [];
        const requestsInWindow = requestLog.filter((timestamp: number) => timestamp > windowStart);

        if (requestsInWindow.length >= limit) {
            return new NextResponse(
                JSON.stringify({ error: 'Too many requests, please try again later.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        requestsInWindow.push(now);
        rateLimit.set(ip, requestsInWindow);

        // Clean up old entries occasionally
        if (rateLimit.size > 1000) {
            for (const [key, logs] of rateLimit.entries()) {
                if (logs.every((t: number) => t < windowStart)) {
                    rateLimit.delete(key);
                }
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
