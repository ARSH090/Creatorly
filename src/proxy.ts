import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {

    const pathname = req.nextUrl.pathname;
    const hostname = req.headers.get('host') || '';

    // 1. Custom Domain Handling
    // If not on main domain or localhost, target as custom domain
    const mainDomains = ['creatorly.app', 'localhost:3000', 'creatorly-beta.vercel.app'];
    const isMainDomain = mainDomains.some(d => hostname.includes(d));

    if (!isMainDomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
        // Rewrite to /u/ (username logic would need a lookup or a convention)
        // For standard SaaS, we'd lookup the creatorId/username associated with this domain
        // For this audit, we implement the rewrite pattern
        return NextResponse.rewrite(new URL(`/custom-domain/${hostname}${pathname}`, req.url));
    }


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

    // Generate CSP
    const cspValues = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://*.razorpay.com", "https://accounts.google.com"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'img-src': ["'self'", "data:", "blob:", "https://*.razorpay.com", "https://*.googleusercontent.com", "https://*.firebaseapp.com", "https://creatorly-assets.s3.ap-south-1.amazonaws.com", "https://s3.ap-south-1.amazonaws.com"],
        'connect-src': ["'self'", "https://*.razorpay.com", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebaseapp.com", "https://accounts.google.com"],
        'frame-src': ["'self'", "https://api.razorpay.com", "https://*.razorpay.com", "https://accounts.google.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
    };

    const cspHeader = Object.entries(cspValues)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }


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
