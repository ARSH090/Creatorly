import { google } from 'googleapis';
import { User } from '@/lib/models/User';
import { Booking } from '@/lib/models/Booking';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google` // Or whatever your redirect is
);

export async function createGoogleMeetEvent(bookingId: string) {
    const booking = await Booking.findById(bookingId).populate('creatorId');
    if (!booking) throw new Error('Booking not found');

    const creator = booking.creatorId as any;

    if (!creator.googleAccessToken || !creator.googleRefreshToken) {
        throw new Error('Creator has not connected Google Calendar');
    }

    oauth2Client.setCredentials({
        access_token: creator.googleAccessToken,
        refresh_token: creator.googleRefreshToken,
        expiry_date: creator.googleTokenExpiry?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const eventDetails = {
        summary: `Meeting with ${booking.clientName}`,
        description: `Creatorly Booking\nClient Email: ${booking.clientEmail}`,
        start: {
            dateTime: booking.startTime.toISOString(),
            timeZone: booking.timezone || 'UTC'
        },
        end: {
            dateTime: booking.endTime.toISOString(),
            timeZone: booking.timezone || 'UTC'
        },
        conferenceData: {
            createRequest: {
                requestId: booking._id.toString(),
                conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
        },
        attendees: [{ email: booking.clientEmail }]
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: eventDetails
        });

        const meetLink = response.data.hangoutLink;
        const eventId = response.data.id;

        if (meetLink) {
            booking.meetingLink = meetLink;
            booking.calendarEventId = eventId;
            booking.meetLinkGeneratedAt = new Date();
            await booking.save();

            // Refresh tokens if they were updated by the client
            const newTokens = oauth2Client.credentials;
            if (newTokens.access_token !== creator.googleAccessToken) {
                creator.googleAccessToken = newTokens.access_token;
                if (newTokens.refresh_token) creator.googleRefreshToken = newTokens.refresh_token;
                if (newTokens.expiry_date) creator.googleTokenExpiry = new Date(newTokens.expiry_date);
                await creator.save();
            }

            return meetLink;
        }

        throw new Error('No Meet link generated in the response');
    } catch (error) {
        console.error('Failed to create Google Meet event:', error);

        // If auth error, update tokens just in case googleapis refreshed them before throwing
        const newTokens = oauth2Client.credentials;
        if (newTokens.access_token !== creator.googleAccessToken && newTokens.access_token) {
            creator.googleAccessToken = newTokens.access_token;
            if (newTokens.refresh_token) creator.googleRefreshToken = newTokens.refresh_token;
            if (newTokens.expiry_date) creator.googleTokenExpiry = new Date(newTokens.expiry_date);
            await creator.save();
        }

        throw error;
    }
}
