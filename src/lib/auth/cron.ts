import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the CRON_SECRET for incoming cron requests.
 * Supports both standard Authorization Bearer header and Vercel-specific tokens.
 */
export function validateCronSecret(req: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    
    // If no secret is configured, deny all (Safety first)
    if (!cronSecret) {
        console.error('[SEC] CRON_SECRET is not configured. Blocking cron request.');
        return false;
    }

    const authHeader = req.headers.get('authorization');
    const vercelCronHeader = req.headers.get('x-vercel-cron');

    // Check Authorization: Bearer <secret>
    if (authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    // fallback for other auth mechanisms if needed
    
    return false;
}

/**
 * Higher-order function to wrap cron route handlers with security.
 */
export function withCronAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        if (!validateCronSecret(req)) {
            console.warn(`[SEC] Unauthorized cron attempt from IP: ${req.ip || 'unknown'}`);
            return new NextResponse('Unauthorized', { status: 401 });
        }
        return handler(req);
    };
}
