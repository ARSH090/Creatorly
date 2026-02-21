import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/leads/export
 * Exports all leads for the authenticated creator as CSV
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const leads = await Lead.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    if (leads.length === 0) {
        return NextResponse.json({ message: 'No leads found to export' }, { status: 404 });
    }

    // CSV Headers
    const headers = ['Email', 'Name', 'Phone', 'Interest', 'Source', 'DM Status', 'Created At'];

    // CSV Rows
    const rows = leads.map(lead => [
        lead.email,
        lead.name || '',
        lead.phone || '',
        lead.interest || '',
        lead.source || '',
        lead.dmStatus || 'none',
        new Date(lead.createdAt).toLocaleString()
    ]);

    // Construct CSV String
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}

export const GET = withCreatorAuth(withErrorHandler(handler));
