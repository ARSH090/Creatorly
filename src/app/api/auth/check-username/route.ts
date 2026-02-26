import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

/** Usernames that conflict with app routes and cannot be registered */
const RESERVED_USERNAMES = new Set([
    'admin', 'dashboard', 'api', 'auth', 'onboarding', 'u', 'cart',
    'checkout', 'pricing', 'setup', 'explore', 'login', 'account',
    'subscribe', 'sso-callback', 'privacy', 'terms', 'support',
    'help', 'about', 'contact', 'blog', 'faq', 'creatorly',
    'creator', 'store', 'shop', 'www', 'mail', 'static', 'cdn',
    'assets', 'media', 'public', 'root', 'undefined', 'null', 'me',
]);

/**
 * GET /api/auth/check-username?username=...
 * 
 * FIXES:
 * - BUG-06: Reserved usernames (routes, system words) are now blocked
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username')?.toLowerCase().trim();

        if (!username || username.length < 3) {
            return NextResponse.json({ available: false, error: 'Username must be at least 3 characters' });
        }

        if (username.length > 30) {
            return NextResponse.json({ available: false, error: 'Username must be 30 characters or fewer' });
        }

        if (!/^[a-z][a-z0-9_-]+$/.test(username)) {
            return NextResponse.json({ available: false, error: 'Username must start with a letter and contain only letters, numbers, underscores, or hyphens' });
        }

        // BUG-06 FIX: Block reserved words that conflict with app routes
        if (RESERVED_USERNAMES.has(username)) {
            return NextResponse.json({ available: false, error: 'This username is reserved' });
        }

        await connectToDatabase();

        const existing = await User.findOne({ username });

        return NextResponse.json({
            available: !existing,
            message: existing ? 'Username already taken' : 'Username available'
        });

    } catch (error: any) {
        console.error('Check Username API error:', error);
        return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 });
    }
}
