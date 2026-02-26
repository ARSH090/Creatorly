import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import abandonedCheckoutRecovery from '@/lib/services/abandonedCheckoutRecovery';

/**
 * CRON: /api/cron/abandoned-checkout
 * Process abandoned checkout recovery emails
 * Should be called every hour
 */
export async function GET(req: NextRequest) {
    try {
        // Verify this is a cron request (you might want to add authentication)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting abandoned checkout recovery processing...');
        
        await connectToDatabase();
        await abandonedCheckoutRecovery.processPendingRecoveries();
        
        console.log('Abandoned checkout recovery processing completed');
        
        return NextResponse.json({ 
            success: true, 
            message: 'Abandoned checkout recovery processed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Abandoned Checkout Recovery CRON Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process abandoned checkout recovery',
                message: error.message,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
}

/**
 * Also support POST for cron services that use POST
 */
export async function POST(req: NextRequest) {
    return GET(req);
}
