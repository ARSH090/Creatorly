import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WhatsAppContact } from '@/lib/models/WhatsAppContact';
import csv from 'csv-parser';
import { Readable } from 'stream';

export const POST = withAuth(async (req: NextRequest, { userId }) => {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const readable = new Readable();
        readable.push(Buffer.from(buffer));
        readable.push(null);

        await connectToDatabase();

        let imported = 0;
        let errors = 0;

        const processRecords = () => new Promise((resolve, reject) => {
            readable.pipe(csv())
                .on('data', async (record) => {
                    try {
                        const phone = record.phone || record.Phone || record.phoneNumber || record['Phone Number'];
                        if (!phone) return;

                        const cleanPhone = phone.replace(/[^\d+]/g, '');
                        if (cleanPhone.length < 10) return;

                        const tags = (record.tags || record.Tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);

                        await WhatsAppContact.findOneAndUpdate(
                            { creatorId: userId, phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}` },
                            {
                                $set: {
                                    name: record.name || record.Name || undefined,
                                    tags: tags,
                                    source: 'bulk_import'
                                },
                                $setOnInsert: { creatorId: userId, phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`, optedOut: false }
                            },
                            { upsert: true }
                        );
                        imported++;
                    } catch (err) {
                        errors++;
                    }
                })
                .on('end', () => resolve({ imported, errors }))
                .on('error', reject);
        });

        const result: any = await processRecords();

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${result.imported} contacts. ${result.errors} errors.`,
            count: result.imported
        });

    } catch (error: any) {
        console.error('[WhatsApp Import] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
