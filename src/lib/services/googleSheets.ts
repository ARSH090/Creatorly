import { google } from 'googleapis';

// Decode base64 private key - Handle potential encoding issues
const privateKey = Buffer.from(
    process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64 || '',
    'base64'
).toString('utf-8');

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = 'Leads'; // Ensure your sheet tab matches this

interface LeadData {
    name: string;
    phone: string;
    email: string;
    interest: string;
    createdAt: Date;
}

/**
 * Append a lead row to the Google Sheet.
 * Called asynchronously (fire-and-forget).
 */
export async function appendLeadToSheet(lead: LeadData) {
    try {
        if (!SPREADSHEET_ID) {
            console.warn('⚠️ GOOGLE_SHEETS_SPREADSHEET_ID not set, skipping backup');
            return;
        }

        if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64) {
            console.warn('⚠️ Google Sheets credentials not fully set, skipping backup');
            return;
        }

        // Prepare row values
        const values = [[
            lead.name,
            lead.phone,
            lead.email,
            lead.interest,
            new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        ]];

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:E`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values,
            },
        };

        const response = await sheets.spreadsheets.values.append(request);
        console.log(`✅ Google Sheet updated: ${response.data.updates?.updatedRows} row(s) appended`);
    } catch (error) {
        console.error('❌ Google Sheets append error:', error);
    }
}
