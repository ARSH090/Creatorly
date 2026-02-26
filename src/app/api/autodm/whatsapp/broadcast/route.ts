import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WhatsAppContact } from '@/lib/models/WhatsAppContact';
import { QueueJob } from '@/lib/models/QueueJob';
import { User } from '@/lib/models/User';

export const POST = withAuth(async (req: NextRequest, { userId }) => {
    try {
        const { contactIds, tags, templateName, languageCode, components, variables } = await req.json();

        if (!templateName) {
            return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user?.whatsappConfig?.accessToken) {
            return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 });
        }

        let query: any = { creatorId: userId, optedOut: false };
        if (contactIds && contactIds.length > 0) {
            query._id = { $in: contactIds };
        } else if (tags && tags.length > 0) {
            query.tags = { $in: tags };
        }

        const contacts = await WhatsAppContact.find(query);
        if (contacts.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 404 });
        }

        const jobs = contacts.map(contact => ({
            type: 'dm_delivery',
            payload: {
                recipientId: contact.phone,
                creatorId: userId,
                platform: 'whatsapp',
                messageType: 'template',
                variables: {
                    ...variables,
                    templateName,
                    languageCode: languageCode || 'en',
                    components,
                    firstName: contact.name || 'there'
                },
                source: 'broadcast'
            },
            status: 'pending',
            nextRunAt: new Date()
        }));

        await QueueJob.insertMany(jobs);

        // Trigger worker
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workers/process-queue`, {
            headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            message: `Enqueued broadcast for ${contacts.length} recipients.`,
            count: contacts.length
        });

    } catch (error: any) {
        console.error('[WhatsApp Broadcast] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
