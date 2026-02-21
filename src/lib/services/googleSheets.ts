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
 * Append a lead row to the Google Sheet with retry logic.
 */
export async function appendLeadToSheet(lead: LeadData, retries = 3, delay = 1000) {
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

    for (let i = 0; i < retries; i++) {
        try {
            const response = await sheets.spreadsheets.values.append(request);
            console.log(`✅ Google Sheet updated: ${response.data.updates?.updatedRows} row(s) appended`);
            return; // Success
        } catch (error: any) {
            const isRateLimit = error.code === 429;
            const isServerError = error.code >= 500;

            if ((isRateLimit || isServerError) && i < retries - 1) {
                const waitTime = delay * Math.pow(2, i);
                console.warn(`⚠️ Google Sheets append failed (Attempt ${i + 1}/${retries}). Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error('❌ Google Sheets final failure:', error.message || error);

            // Trigger operational alert (Email placeholder)
            if (process.env.ADMIN_EMAIL) {
                try {
                    const { sendEmail } = await import('@/lib/services/email');
                    await sendEmail({
                        to: process.env.ADMIN_EMAIL,
                        subject: 'CRITICAL: Google Sheets Integration Failure',
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                                <h2 style="color: #e11d48;">Google Sheets Sync Failed</h2>
                                <p>Lead sync failed after <strong>${retries}</strong> retries.</p>
                                <p><strong>Lead Email:</strong> ${lead.email}</p>
                                <p><strong>Error:</strong> ${error.message}</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 12px; color: #666;">This is an automated operational alert from Creatorly Neural Engine.</p>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error('❌ Failed to send sheet failure alert email');
                }
            }
            break;
        }
    }
}
