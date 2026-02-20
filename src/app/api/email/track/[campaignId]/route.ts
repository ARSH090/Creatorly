import { NextRequest, NextResponse } from 'next/server';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const { campaignId } = await params;

        // Return 1x1 transparent GIF immediately
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );

        // Fire and forget stats update
        (async () => {
            try {
                await dbConnect();
                await EmailCampaign.findByIdAndUpdate(campaignId, {
                    $inc: { 'stats.opened': 1 }
                });
            } catch (err) {
                console.error('Failed to track email open:', err);
            }
        })();

        return new NextResponse(pixel, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        return new NextResponse(null, { status: 500 }); // Fail silently
    }
}
