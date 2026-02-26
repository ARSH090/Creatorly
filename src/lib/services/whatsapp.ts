import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

const GRAPH_BASE_URL = 'https://graph.facebook.com';
const VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

export interface WhatsAppSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    errorCode?: string;
}

export class WhatsAppService {
    /**
     * Send a text message via WhatsApp Business API
     */
    static async sendTextMessage(params: {
        to: string;
        text: string;
        phoneNumberId: string;
        accessToken: string;
    }): Promise<WhatsAppSendResult> {
        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/${params.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: params.to,
                    type: 'text',
                    text: { body: params.text }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${params.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Send a template message (required for opening 24h window)
     */
    static async sendTemplateMessage(params: {
        to: string;
        templateName: string;
        languageCode: string;
        components?: any[];
        phoneNumberId: string;
        accessToken: string;
    }): Promise<WhatsAppSendResult> {
        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/${params.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'template',
                    template: {
                        name: params.templateName,
                        language: { code: params.languageCode },
                        components: params.components
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${params.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Send a media message (Image, PDF, Video)
     */
    static async sendMediaMessage(params: {
        to: string;
        type: 'image' | 'document' | 'video';
        url: string;
        caption?: string;
        phoneNumberId: string;
        accessToken: string;
    }): Promise<WhatsAppSendResult> {
        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/${params.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: params.type,
                    [params.type]: {
                        link: params.url,
                        caption: params.caption
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${params.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Send an interactive button message
     */
    static async sendButtonMessage(params: {
        to: string;
        text: string;
        buttons: Array<{ id: string; title: string }>;
        phoneNumberId: string;
        accessToken: string;
    }): Promise<WhatsAppSendResult> {
        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/${params.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: params.to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: params.text },
                        action: {
                            buttons: params.buttons.map(b => ({
                                type: 'reply',
                                reply: { id: b.id, title: b.title }
                            }))
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${params.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    private static handleError(error: any): WhatsAppSendResult {
        const axiosError = error as AxiosError<any>;
        const metaError = axiosError.response?.data?.error;
        console.error('[WhatsAppService] Error:', metaError || axiosError.message);
        return {
            success: false,
            error: metaError?.message || axiosError.message,
            errorCode: metaError?.code?.toString() || 'UNKNOWN_ERROR'
        };
    }

    /**
     * Verify WhatsApp webhook signature
     */
    static verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
        try {
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');
            return crypto.timingSafeEqual(
                Buffer.from(signature.replace('sha256=', '')),
                Buffer.from(expectedSignature.replace('sha256=', ''))
            );
        } catch (error) {
            console.error('[WhatsAppService] Webhook verification failed:', error);
            return false;
        }
    }
    /**
     * Legacy export for backward compatibility
     */
    static async sendWhatsAppMessage(params: any) {
        return this.sendTextMessage(params);
    }
}

export const sendWhatsAppMessage = async (params: any) => {
    return WhatsAppService.sendTextMessage(params);
};

export const buildWhatsAppMessage = (name: string, interest: string) => {
    return `Hi ${name}! Thanks for your interest in ${interest}. How can we help you today?`;
};

export const generateWhatsAppDeepLink = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const enqueueWhatsAppAutoSend = async (data: any) => {
    console.log('[WhatsApp] Auto-send enqueued (Stub):', data);
    return { success: true };
};

export default WhatsAppService;
