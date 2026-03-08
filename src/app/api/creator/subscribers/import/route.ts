import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { hasFeature } from '@/lib/utils/planLimits';
import crypto from 'crypto';

async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user, 'emailMarketing')) {
        return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    try {
        const data = await req.formData();
        const file = data.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
        }

        const text = await file.text();
        const rows = text.split('\n').map(r => r.trim()).filter(Boolean);
        if (rows.length < 2) {
            return NextResponse.json({ error: 'CSV must contain a header and at least one row' }, { status: 400 });
        }

        const headers = rows[0].toLowerCase().split(',');
        const emailIdx = headers.indexOf('email');
        let nameIdx = headers.indexOf('name');
        if (nameIdx === -1) nameIdx = headers.indexOf('first_name'); // Fallback

        if (emailIdx === -1) {
            return NextResponse.json({ error: 'CSV must contain an "email" column' }, { status: 400 });
        }

        const validSubscribers = [];
        let skipped = 0;

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const email = cols[emailIdx]?.toLowerCase();
            const name = nameIdx !== -1 ? cols[nameIdx] : email?.split('@')[0];

            if (!email || !email.includes('@')) {
                skipped++;
                continue;
            }

            validSubscribers.push({
                creatorId: user._id,
                email,
                name: name || 'there',
                status: 'active' as const,
                source: 'imported',
                unsubscribeToken: crypto.randomBytes(32).toString('hex')
            });
        }

        if (validSubscribers.length === 0) {
            return NextResponse.json({ error: 'No valid subscribers found' }, { status: 400 });
        }

        // Use unordered bulk operations to ignore duplicates (unique index on email + creatorId)
        try {
            const bulkOps = validSubscribers.map(sub => ({
                updateOne: {
                    filter: { email: sub.email, creatorId: user._id },
                    update: { $setOnInsert: sub },
                    upsert: true
                }
            }));
            await Subscriber.bulkWrite(bulkOps, { ordered: false });
        } catch (e: any) {
            // Bulk write throws if duplicates exist during insert if doing ordered=true
            // or if other errors. With unordered=false we still might get a bulkWriteError, just log it.
            console.error('Import bulk write partial failure:', e);
        }

        return NextResponse.json({
            success: true,
            imported: validSubscribers.length,
            skipped,
            message: `Successfully queued ${validSubscribers.length} subscribers for import.`
        });
    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}

export const POST = withCreatorAuth(postHandler);
