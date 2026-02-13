/**
 * SMS Service for Creatorly
 * 
 * Currently a stub that logs to console.
 * Ready for integration with Twilio / Msg91 / etc.
 */

export interface SMSOptions {
    to: string;
    body: string;
}

export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; error?: any }> {
    try {
        // In a real implementation, we would call an external API here
        // const client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        // await client.messages.create({ ... });

        // For now, we log to console which will be picked up by our logging infrastructure
        console.log(`[SMS STUB] To: ${options.to} | Body: ${options.body}`);

        return { success: true };
    } catch (error) {
        console.error('[SMS STUB] Failed to send SMS:', error);
        return { success: false, error };
    }
}
