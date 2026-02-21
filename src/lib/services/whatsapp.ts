import axios from 'axios';

const WHATSAPP_BASE_URL = 'https://graph.facebook.com';
const API_VERSION = process.env.WHATSAPP_VERSION || 'v19.0';

export interface WhatsAppMessage {
    phone: string;
    message?: string;
    templateName?: string;
    languageCode?: string;
    components?: any[];
}

/**
 * Sends a message via WhatsApp Business Platform (Meta Cloud API)
 */
export async function sendWhatsAppMessage(data: WhatsAppMessage) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
        console.warn('⚠️ WhatsApp API credentials not configured');
        return { success: false, error: 'Credentials missing' };
    }

    try {
        const url = `${WHATSAPP_BASE_URL}/${API_VERSION}/${phoneNumberId}/messages`;

        const payload: any = {
            messaging_product: 'whatsapp',
            to: data.phone,
        };

        if (data.templateName) {
            payload.type = 'template';
            payload.template = {
                name: data.templateName,
                language: { code: data.languageCode || 'en_US' },
                components: data.components
            };
        } else {
            payload.type = 'text';
            payload.text = { body: data.message };
        }

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            messageId: response.data?.messages?.[0]?.id,
            recipientId: response.data?.contacts?.[0]?.wa_id
        };
    } catch (error: any) {
        const errData = error.response?.data?.error;
        console.error('❌ WhatsApp delivery error:', errData || error.message);
        return {
            success: false,
            error: errData?.message || error.message,
            code: errData?.code
        };
    }
}

/**
 * Generate a WhatsApp deep link
 */
export function generateWhatsAppDeepLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}


/**
 * Build components for a product link template
 */
export function buildProductTemplateComponents(productName: string, productLink: string) {
    return [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: productName }
            ]
        },
        {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
                { type: 'text', text: productLink.split('/').pop() || '' }
            ]
        }
    ];
}

/**
 * Build a dynamic WhatsApp message for lead capture
 */
export function buildWhatsAppMessage(name: string, interest: string): string {
    const firstName = name.split(' ')[0];
    return `Hey ${firstName}! 👋 Thanks for your interest in "${interest}". I'll be reaching out shortly to help you with the next steps. Stay tuned!`;
}

/**
 * Enqueue a WhatsApp message for auto-send
 */
export async function enqueueWhatsAppAutoSend(data: {
    leadId: string;
    name: string;
    phone: string;
    interest: string;
    message: string;
}) {
    const { QueueJob } = await import('@/lib/models/QueueJob');

    try {
        await QueueJob.create({
            type: 'dm_delivery',
            payload: {
                recipientId: data.phone,
                text: data.message,
                creatorId: 'system', // or fetch the actual creatorId if needed
                platform: 'whatsapp',
                source: 'automation'
            },
            status: 'pending',
            nextRunAt: new Date()
        });

        console.log(`[WhatsApp Queue] Enqueued message for ${data.phone}`);
    } catch (error) {
        console.error('Failed to enqueue WhatsApp message:', error);
        throw error;
    }
}
