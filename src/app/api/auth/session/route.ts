import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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
