import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';



export async function POST(req: Request) {
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 1. Rate Limiting (10 attempts per minute to prevent session hammering)
    const isAllowed = await RedisRateLimiter.check('session', 10, 60 * 1000, ip);
    if (!isAllowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = req.headers.get('authorization');

    const { action } = await req.json().catch(() => ({}));

    if (action === 'logout') {
        const cookieStore = await cookies();
        cookieStore.delete('authToken');
        return NextResponse.json({ success: true, message: 'Logged out' });
    }

    if (!authHeader) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const cookieStore = await cookies();
    cookieStore.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    return NextResponse.json({ success: true });
}
