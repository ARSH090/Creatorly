import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withCronAuth } from '@/lib/auth/cron';
import abandonedCheckoutRecovery from '@/lib/services/abandonedCheckoutRecovery';

export const GET = withCronAuth(async (req: NextRequest) => {
    try {
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
});

/**
 * Also support POST for cron services that use POST
 */
export async function POST(req: NextRequest) {
    return GET(req);
}
