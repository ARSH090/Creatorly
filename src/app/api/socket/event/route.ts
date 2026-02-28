import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const secret = req.headers.get('x-internal-secret');

        if (secret !== (process.env.INTERNAL_SECRET || 'dev-secret')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, creatorId, data } = body;

        // Note: Accessing the global 'io' instance in Next.js App Router 
        // usually requires it to be attached to the global object or a singleton lib
        const globalWithIo = global as any;

        if (globalWithIo.io) {
            globalWithIo.io.to(`creator:${creatorId}`).emit('notification', {
                type,
                message: `New sale: ${data.productName} for ₹${data.amount}`,
                data
            });
            return NextResponse.json({ success: true });
        } else {
            console.warn('[Realtime API] Socket.io instance not found on global object');
            return NextResponse.json({ error: 'Socket server not running' }, { status: 503 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
