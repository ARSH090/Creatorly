import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req: NextRequest) => {
    try {
        await connectToDatabase();
        const users = await User.find({}).lean();

        const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined At'];
        const rows = users.map(u => [
            u._id.toString(),
            u.displayName || '',
            u.email,
            u.role,
            u.isSuspended ? 'Suspended' : 'Active',
            u.createdAt ? new Date(u.createdAt).toISOString() : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
