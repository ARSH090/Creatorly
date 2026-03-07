import { NextRequest, NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { sendMarketingEmail } from '@/lib/services/email';

async function handler(req: NextRequest, user: any) {
    const body = await req.json();
    const { testEmail, subject, content } = body;

    if (!testEmail || !subject || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creatorName = user.displayName || user.fullName || 'Creator';

    // Replace placeholders for test
    const finalContent = content.replace(/\{\{first_name\}\}/g, 'Test User');

    const result = await sendMarketingEmail(
        testEmail,
        {
            subject: `[TEST] ${subject}`,
            html: finalContent,
        }
    );

    if (result.success) {
        return NextResponse.json({ success: true, message: 'Test email delivered' });
    } else {
        return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
}

export const POST = withCreatorAuth(withErrorHandler(handler));
