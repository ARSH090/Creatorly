import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
);

export const getGoogleAuthUrl = (state: string) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state,
        prompt: 'consent'
    });
};

export const getTokensFromCode = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

export const getCalendarClient = (tokens: any) => {
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: client });
};

export const createCalendarEvent = async (tokens: any, eventData: any) => {
    const calendar = getCalendarClient(tokens);
    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
        conferenceDataVersion: 1
    } as any);
    return response.data;
};
