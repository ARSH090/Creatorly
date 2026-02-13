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
        const response = NextResponse.rewrite(new URL(`/custom-domain/${hostname}${pathname}`, request.url));

        // Handle affiliate tracking even on custom domains
        const refCode = request.nextUrl.searchParams.get('ref');
        if (refCode) {
            response.cookies.set('affiliate_ref', refCode, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }
        return response;
    }

    // 0.5 Affiliate Booking (Ref Code)
    const refCode = request.nextUrl.searchParams.get('ref');
    // Initialize response
    let response = NextResponse.next();

    if (refCode) {
        response.cookies.set('affiliate_ref', refCode, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
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

    response = NextResponse.next();

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

    // 3. Rate Limiting (Upstash Redis with Fallback)
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/user')) {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

        try {
            // Try to use Upstash Redis if available
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                const { Redis } = await import('@upstash/redis');
                const redis = Redis.fromEnv();

                const limit = 20;
                const window = 60; // seconds

                const key = `rate_limit:${ip}`;
                const requests = await redis.incr(key);

                if (requests === 1) {
                    await redis.expire(key, window);
                }

                if (requests > limit) {
                    return new NextResponse(
                        JSON.stringify({ error: 'Too many requests, please try again later.' }),
                        { status: 429, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            } else {
                // Fallback to In-Memory (Per-Lambda)
                const limit = 20;
                const windowMs = 60 * 1000;
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

                // Cleanup
                if (rateLimit.size > 1000) {
                    for (const [key, logs] of rateLimit.entries()) {
                        if (logs.every((t: number) => t < windowStart)) rateLimit.delete(key);
                    }
                }
            }
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open if rate limit fails
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
