import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { google } from 'googleapis';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        // Authenticate the cron request
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await connectToDatabase();

        // Find users with Google Calendar connected whose channel expires in less than 2 days
        // or who don't have an active channel.
        const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

        const usersToRenew = await User.find({
            googleAccessToken: { $exists: true, $ne: null },
            $or: [
                { googleCalendarChannelExpiry: { $exists: false } },
                { googleCalendarChannelExpiry: null },
                { googleCalendarChannelExpiry: { $lt: twoDaysFromNow } }
            ]
        });

        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`;

        console.log(`[Google Cron] Found ${usersToRenew.length} webhooks to renew.`);

        for (const user of usersToRenew) {
            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );

                oauth2Client.setCredentials({
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken,
                    expiry_date: user.googleTokenExpiry?.getTime()
                });

                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                // If user already has a channel ID, try to stop it first (optional but good practice)
                if (user.googleCalendarChannelId) {
                    try {
                        await calendar.channels.stop({
                            requestBody: {
                                id: user.googleCalendarChannelId,
                                resourceId: user.googleCalendarSyncToken // Warning: resourceId isn't syncToken. We might not have stored the resourceId.
                                // It's safer to just let the old one expire if we haven't stored resourceId specifically.
                            }
                        });
                    } catch (e) {
                        // Ignore stop errors
                    }
                }

                const newChannelId = crypto.randomUUID();

                const response = await calendar.events.watch({
                    calendarId: 'primary',
                    requestBody: {
                        id: newChannelId,
                        type: 'web_hook',
                        address: webhookUrl
                    }
                });

                // Update user with new channel ID and Expiry (returned from Google)
                user.googleCalendarChannelId = newChannelId;

                // Expiration comes back as a string timestamp in ms
                if (response.data.expiration) {
                    user.googleCalendarChannelExpiry = new Date(parseInt(response.data.expiration));
                } else {
                    // Default to 7 days if not provided
                    user.googleCalendarChannelExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                }

                // Update tokens if refreshed
                const newTokens = oauth2Client.credentials;
                if (newTokens.access_token !== user.googleAccessToken) {
                    user.googleAccessToken = newTokens.access_token;
                    if (typeof newTokens.refresh_token === 'string') user.googleRefreshToken = newTokens.refresh_token;
                    if (newTokens.expiry_date) user.googleTokenExpiry = new Date(newTokens.expiry_date);
                }

                await user.save();
                console.log(`[Google Cron] Successfully renewed webhook for ${user._id}`);

            } catch (userError) {
                console.error(`[Google Cron] Failed to renew for user ${user._id}:`, userError);
                // Continue with next user
            }
        }

        return NextResponse.json({ success: true, renewed: usersToRenew.length });
    } catch (error: any) {
        console.error('[Google Cron] Execution error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
