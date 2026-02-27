import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { authRateLimit, usernameCheckRateLimit, paymentRateLimit, publicApiRateLimit, webhookRateLimit } from "@/lib/security/global-ratelimit";

// Protected routes - require authentication
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
    '/onboarding(.*)',
    '/api/user(.*)',
    '/api/creator(.*)',
    '/api/payments(.*)',
    '/api/admin(.*)',
    '/api/portal/(.*)',
]);

// Auth routes - redirect to dashboard if already logged in
const isAuthRoute = createRouteMatcher([
    '/auth/login(.*)',
    '/auth/register(.*)',
    '/auth/forgot-password(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/login(.*)',
    '/signup(.*)'
]);

// Public routes - accessible without authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/sso-callback',
    '/api/webhooks(.*)',
    '/u/(.*)',
    '/pricing',
    '/features',
    '/blog(.*)',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/thank-you',
    '/learn(.*)',
    '/book(.*)',
    '/[username](.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;

    // ── Bypass for Testing ──
    const testSecret = process.env.TEST_SECRET;
    const incomingSecret = req.headers.get('x-test-secret');
    if (testSecret && incomingSecret === testSecret) {
        return NextResponse.next();
    }

    const { userId } = await auth();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || (req as any).ip || '127.0.0.1';

    // ── Rate Limiting ──
    const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL;
    if (hasRedis) {
        try {
            let limit;
            if (pathname === '/api/auth/check-username') {
                limit = await usernameCheckRateLimit.limit(ip);
            } else if (pathname.startsWith('/api/auth')) {
                limit = await authRateLimit.limit(ip);
            } else if (pathname.startsWith('/api/payments')) {
                limit = await paymentRateLimit.limit(ip);
            } else if (pathname.startsWith('/api/webhooks')) {
                limit = await webhookRateLimit.limit(ip);
            } else if (!pathname.startsWith('/_next') && isPublicRoute(req)) {
                limit = await publicApiRateLimit.limit(ip);
            }

            if (limit && !limit.success) {
                return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (err) {
            console.error('Rate limit error:', err);
        }
    }

    // 1. Protect Routes
    if (isProtectedRoute(req)) {
        const authObj = await auth();
        await authObj.protect();
    }

    // 2. Handle Auth Routes
    if (isAuthRoute(req) && userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 3. Admin & Role Protection
    const authObj = await auth();
    const { sessionClaims } = authObj;
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const role = (sessionClaims?.metadata as any)?.role;
        if (role && role !== 'admin' && role !== 'super-admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    const response = NextResponse.next();

    // ── UTM & Traffic Tracking ──
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];
    const hasUtm = utmParams.some(p => req.nextUrl.searchParams.has(p));

    if (hasUtm) {
        // We set a ephemeral header that the page component can use to trigger the recordTrafficHit
        utmParams.forEach(p => {
            const val = req.nextUrl.searchParams.get(p);
            if (val) response.headers.set(`X-Track-${p}`, val);
        });
    }

    // ── Affiliate Tracking ──
    const ref = req.nextUrl.searchParams.get('ref');
    if (ref) {
        response.cookies.set('affiliate_code', ref, {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }

    // 4. Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 5. Custom Domain & Path Routing
    const firstSegment = pathname.split('/')[1];
    const reservedPaths = [
        'admin', 'dashboard', 'superadmin', 'auth', 'login', 'signup', 'register', 'sign-in', 'sign-up',
        'api', 'trpc', 'u', 'pricing', 'features', 'blog', 'terms', 'privacy', 'refund-policy', '_next',
        'subscribe', 'onboarding', 'checkout', 'cart', 'learn', 'book', 'explore', 'p', 'portal',
        'thank-you', 'order-success', 'sso-callback', 'account', 'autodm', 'user-profile', 'ref', 'setup',
        'subscription'
    ];

    const hostname = req.headers.get("host") || "";
    const cleanHostname = hostname.split(':')[0];
    const isCustomDomain =
        !cleanHostname.includes("localhost") &&
        !cleanHostname.includes(process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').split(':')[0] || "creatorly.in") &&
        !cleanHostname.includes("vercel.app");

    if (isCustomDomain && hasRedis) {
        try {
            const { Redis } = await import('@upstash/redis');
            const redis = Redis.fromEnv();
            const username = await redis.get(`domain:${cleanHostname}`);

            if (username && typeof username === 'string') {
                const url = req.nextUrl.clone();
                // Map root and storefront subpaths to /u/[username]
                if (pathname === '/' || pathname === '/book' || pathname === '/community' || pathname === '/learn') {
                    url.pathname = `/u/${username}${pathname === '/' ? '' : pathname}`;
                    return NextResponse.rewrite(url);
                }
            }
        } catch (err) {
            console.error('Redis domain mapping error in middleware:', err);
        }
    }

    if (firstSegment && !reservedPaths.includes(firstSegment) && !pathname.includes('.')) {
        const url = req.nextUrl.clone();
        url.pathname = `/u/${pathname.substring(1)}`;
        return NextResponse.rewrite(url);
    }

    return response;
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
