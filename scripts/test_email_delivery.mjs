import dotenv from 'dotenv';
import { sendWelcomeEmail } from './src/lib/services/email';

dotenv.config({ path: '.env.local' });

async function testEmail() {
    console.log('Testing email delivery via Resend...');
    const testEmailAddress = 'test-recipient@example.com'; // Note: In test mode, Resend might only allow verified domains/emails

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing from .env.local');
        process.exit(1);
    }

    const result = await sendWelcomeEmail(testEmailAddress, 'Test User');
    console.log('Result:', JSON.stringify(result, null, 2));
}

testEmail().catch(console.error);
