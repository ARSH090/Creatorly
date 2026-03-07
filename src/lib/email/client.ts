import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Standardized email sending wrapper using Resend
 */
export async function sendEmail(options: EmailOptions) {
    try {
        if (!resend) {
            console.warn('Email service not configured (RESEND_API_KEY not set)');
            if (process.env.NODE_ENV === 'development') {
                console.log('--- DEV EMAIL SIMULATION ---');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log('----------------------------');
            }
            return { success: false, error: 'Email service not configured' };
        }

        const { data, error } = await resend.emails.send({
            from: options.from || process.env.RESEND_FROM_EMAIL || 'Creatorly <noreply@creatorly.in>',
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', data?.id);
        return { success: true, id: data?.id };
    } catch (err) {
        console.error('Unexpected email send failure:', err);
        return { success: false, error: err };
    }
}
