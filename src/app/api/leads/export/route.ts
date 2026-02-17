import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/leads/export
 * Exports leads as CSV (creator only)
 */
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        // Get authenticated user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const leadMagnetId = searchParams.get('lead_magnet_id');

        // Build query
        const query: any = { creatorId: userId };
        if (leadMagnetId) {
            query.leadMagnetId = leadMagnetId;
        }

        // Fetch all leads
        const leads = await Lead.find(query)
            .populate('leadMagnetId', 'title')
            .sort({ createdAt: -1 })
            .lean();

        // Generate CSV
        const csvLines = [
            'Email,Lead Magnet,Captured At,Download Sent',
        ];

        for (const lead of leads) {
            const leadMagnet = lead.leadMagnetId as any;
            csvLines.push([
                lead.email,
                leadMagnet?.title || 'N/A',
                new Date(lead.createdAt).toISOString(),
                lead.downloadSent ? 'Yes' : 'No',
            ].join(','));
        }

        const csv = csvLines.join('\n');

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads_${Date.now()}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Export leads error:', error);
        return NextResponse.json(
            { error: 'Failed to export leads' },
            { status: 500 }
        );
    }
}
