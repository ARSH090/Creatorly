import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { auth } from '@clerk/nextjs/server';
import User from '@/lib/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/leads/export
 * Exports leads as CSV (creator-specific or platform-wide admin)
 */
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        // Get authenticated user
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user metadata to check role
        const currentUser = await User.findOne({ clerkId });
        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super-admin';
        const targetCreatorId = searchParams.get('creatorId');
        const leadMagnetId = searchParams.get('lead_magnet_id');

        // Build query
        const query: any = {};

        if (isAdmin) {
            // Admins can filter by creator or export everything
            if (targetCreatorId) {
                query.creatorId = targetCreatorId;
            }
        } else {
            // Creators can only export their own leads
            query.creatorId = currentUser._id;
        }

        if (leadMagnetId) {
            query.leadMagnetId = leadMagnetId;
        }

        // Fetch leads with population
        const leads = await Lead.find(query)
            .populate('leadMagnetId', 'title')
            .populate('creatorId', 'email displayName')
            .sort({ createdAt: -1 })
            .lean();

        // Generate CSV Header
        const headers = [
            'Email',
            'Name',
            'Phone',
            'Interest',
            'Source',
            'Lead Magnet',
            'Creator Email',
            'Creator Name',
            'Captured At',
            'Download Sent'
        ];

        const csvLines = [headers.join(',')];

        for (const lead of leads) {
            const leadMagnet = lead.leadMagnetId as any;
            const creator = lead.creatorId as any;

            const line = [
                `"${lead.email || ''}"`,
                `"${lead.name || ''}"`,
                `"${lead.phone || ''}"`,
                `"${lead.interest || ''}"`,
                `"${lead.source || ''}"`,
                `"${leadMagnet?.title || 'N/A'}"`,
                `"${creator?.email || 'N/A'}"`,
                `"${creator?.displayName || 'N/A'}"`,
                `"${new Date(lead.createdAt).toISOString()}"`,
                `"${lead.downloadSent ? 'Yes' : 'No'}"`
            ];
            csvLines.push(line.join(','));
        }

        const csv = csvLines.join('\n');

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.csv"`,
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
