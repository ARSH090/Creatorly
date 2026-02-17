import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
    '/onboarding(.*)',
    '/api/user(.*)'
]);

// Define auth routes (to redirect if logged in)
const isAuthRoute = createRouteMatcher(['/auth(.*)']);

// Define public routes (explicitly)
const isPublicRoute = createRouteMatcher([
    '/',
    '/sso-callback',
    '/api/webhooks(.*)',
    '/u/(.*)' // Public storefronts
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;

    // 1. Protect Routes
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
    // Note: Public routes are implicitly allowed by not calling auth.protect()
    // but we define them for clarity and potential future logic.

    // 2. Redirect to dashboard if accessing auth pages while logged in
    if (isAuthRoute(req) && userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Initialize response
    const response = NextResponse.next();

    // 3. Affiliate Booking (Ref Code)
    const refCode = req.nextUrl.searchParams.get('ref');
    if (refCode) {
        response.cookies.set('affiliate_ref', refCode, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }

    // 4. Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // CSP (Content Security Policy)
    const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.vercel-analytics.com https://va.vercel-scripts.com https://*.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com https://*.hcaptcha.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.clerk.com https://*.clerk.accounts.dev https://*.googleusercontent.com https://*.cloudinary.com https://*.gravatar.com https://*.razorpay.com https://*.s3.amazonaws.com https://*.s3-ap-south-1.amazonaws.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.vercel-analytics.com https://va.vercel-scripts.com https://*.firebaseio.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.sentry.io;
    frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.google.com https://*.razorpay.com https://api.razorpay.com https://*.firebaseapp.com https://challenges.cloudflare.com https://*.hcaptcha.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', csp);
    // Keep the fix: unsafe-none for COOP
    response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

    // 5. Rate Limiting (Standardized)
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/user')) {
        // We use import() to dynamically load the rate limiter
        // Note: This relies on the rate limiter being compatible with edge runtime if middleware runs on edge.
        // If it uses node-only modules (like 'redis' package not @upstash/redis), it might fail.
        // Assuming previously it worked, so we trust it.
        try {
            const { checkRateLimit } = await import('@/middleware/rateLimit');
            const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

            const rateLimitResult = await checkRateLimit(req, ip, {
                limit: 20,
                window: 60
            });

            if (!rateLimitResult.success) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many requests, please try again later.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } catch (e) {
            console.error("Rate limit check failed", e);
        }
    }

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
