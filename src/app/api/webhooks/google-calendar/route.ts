import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import BlockedSlot from '@/lib/models/BlockedSlot';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const channelId = req.headers.get('x-goog-channel-id');
        const resourceState = req.headers.get('x-goog-resource-state');

        if (!channelId || resourceState === 'sync') {
            // Initial sync or missing ID, ignore/ack
            return new NextResponse('OK', { status: 200 });
        }

        await connectToDatabase();

        // Find the user with this channel ID
        const creator = await User.findOne({ googleCalendarChannelId: channelId });
        if (!creator || !creator.googleAccessToken) {
            console.warn(`[GCal Sync] Unrecognized channel ID: ${channelId}`);
            return new NextResponse('OK', { status: 200 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: creator.googleAccessToken,
            refresh_token: creator.googleRefreshToken,
            expiry_date: creator.googleTokenExpiry?.getTime()
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Fetch changes using syncToken
        // Note: In a robust production environment, you should handle pagination (pageToken) 
        // and full syncs (410 Gone error if syncToken is invalid).
        const params: any = {
            calendarId: 'primary',
            singleEvents: true,
            maxResults: 2500
        };

        if (creator.googleCalendarSyncToken) {
            params.syncToken = creator.googleCalendarSyncToken;
        } else {
            // First time syncing delta, let's just fetch from now onwards to populate
            params.timeMin = new Date().toISOString();
        }

        let response;
        try {
            response = await calendar.events.list(params);
        } catch (err: any) {
            if (err.code === 410) {
                // Sync token expired, do a full sync instead
                console.log(`[GCal Sync] Sync token expired for ${creator._id}, doing full sync`);
                delete params.syncToken;
                params.timeMin = new Date().toISOString(); // Only care about future availability
                response = await calendar.events.list(params);
            } else {
                throw err;
            }
        }

        const events = response.data.items || [];
        const nextSyncToken = response.data.nextSyncToken;

        const bulkOps = [];

        for (const event of events) {
            // Exclude events created by Creatorly itself (Schedulify bookings)
            if (event.description?.includes('Creatorly Booking')) {
                continue;
            }

            if (event.status === 'cancelled') {
                bulkOps.push({
                    deleteOne: {
                        filter: { creatorId: creator._id, calendarEventId: event.id }
                    }
                });
            } else {
                const start = event.start?.dateTime || event.start?.date;
                const end = event.end?.dateTime || event.end?.date;
                const isAllDay = !!event.start?.date;

                if (start && end) {
                    bulkOps.push({
                        updateOne: {
                            filter: { creatorId: creator._id, calendarEventId: event.id },
                            update: {
                                $set: {
                                    startTime: new Date(start as string),
                                    endTime: new Date(end as string),
                                    title: event.summary,
                                    isAllDay
                                }
                            },
                            upsert: true
                        }
                    });
                }
            }
        }

        if (bulkOps.length > 0) {
            await BlockedSlot.bulkWrite(bulkOps, { ordered: false });
        }

        if (nextSyncToken && nextSyncToken !== creator.googleCalendarSyncToken) {
            creator.googleCalendarSyncToken = nextSyncToken;
        }

        // Update tokens if refreshed
        const newTokens = oauth2Client.credentials;
        if (newTokens.access_token !== creator.googleAccessToken) {
            creator.googleAccessToken = newTokens.access_token as string;
            if (newTokens.refresh_token) creator.googleRefreshToken = newTokens.refresh_token;
            if (newTokens.expiry_date) creator.googleTokenExpiry = new Date(newTokens.expiry_date);
        }

        await creator.save();

        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('[GCal Webhook] Error:', error);
        // Always return 200 so Google doesn't aggressively retry unless it's a huge transient failure
        return new NextResponse('OK', { status: 200 });
    }
}
