interface WhatsAppSendOptions {
    to: string;
    message: string;
    leadId?: string;
}

export class WhatsAppService {
    /**
     * Generate a WhatsApp deep link for manual sending.
     * Format: https://wa.me/phone?text=urlEncodedMessage
     */
    static generateDeepLink(phone: string, message: string): string {
        const encodedMessage = encodeURIComponent(message);
        // Remove any non-digit characters from phone (keep + if present)
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    /**
     * Prepare dynamic message template.
     */
    static buildMessage(name: string, interest: string): string {
        return `Hi ${name}, thanks for your interest in ${interest}! How can I assist you today?`;
    }

    /**
     * Enqueue a job for auto-sending (if enabled).
     * This will be processed by the worker.
     */
    static async enqueueAutoSend(data: {
        leadId: string;
        name: string;
        phone: string;
        interest: string;
        message: string;
    }) {
        const { whatsappQueue } = await import('@/lib/queue');
        await whatsappQueue.add('send-whatsapp', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });
    }
}
