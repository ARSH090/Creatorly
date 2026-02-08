import { connectToDatabase } from '@/lib/db/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await connectToDatabase();
        return NextResponse.json({ success: true, message: 'Connected to MongoDB!' });
    } catch (error: any) {
        console.error('Database connection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to connect to database', details: error.message },
            { status: 500 }
        );
    }
}
