import axios from 'axios';

const GRAPH_BASE_URL = 'https://graph.facebook.com';
const VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

interface MetaMessageResponse {
    message_id: string;
    recipient_id: string;
}

export class MetaGraphService {
    /**
     * Exchanges short-lived token for long-lived page token
     */
    static async exchangeForLongLivedToken(shortToken: string) {
        const response = await axios.get(`${GRAPH_BASE_URL}/${VERSION}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: process.env.INSTAGRAM_APP_ID,
                client_secret: process.env.INSTAGRAM_APP_SECRET,
                fb_exchange_token: shortToken,
            },
        });
        return response.data.access_token;
    }


    /**
     * Sends a DM (Text or Attachment) to an Instagram user. 
     */
    static async sendDirectMessage(params: {
        recipientId: string;
        message?: string;
        attachment?: {
            type: 'image' | 'video' | 'audio' | 'file';
            payload: { url: string; is_reusable?: boolean };
        };
        template?: any;
        accessToken: string;
    }): Promise<MetaMessageResponse> {
        try {
            const payload: any = {
                recipient: { id: params.recipientId },
                message: {}
            };

            if (params.message) {
                payload.message.text = params.message;
            } else if (params.attachment) {
                payload.message.attachment = params.attachment;
            } else if (params.template) {
                payload.message.attachment = {
                    type: 'template',
                    payload: params.template
                };
            }

            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/me/messages`,
                payload,
                {
                    params: { access_token: params.accessToken },
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return response.data;
        } catch (error: any) {
            // Standardize error for the queue processor
            const status = error.response?.status;
            const metaError = error.response?.data?.error;

            const errorInfo = {
                status,
                message: metaError?.message || error.message,
                code: metaError?.code,
                isRetryable: status >= 500 || error.code === 'ECONNABORTED' || status === 429
            };

            const enrichedError: any = new Error(JSON.stringify(errorInfo));
            enrichedError.isRetryable = errorInfo.isRetryable;
            throw enrichedError;
        }
    }


    /**
     * Fetches Instagram Business Account ID associated with a Page
     */
    static async getInstagramBusinessId(pageId: string, accessToken: string) {
        const response = await axios.get(`${GRAPH_BASE_URL}/${VERSION}/${pageId}`, {
            params: {
                fields: 'instagram_business_account',
                access_token: accessToken,
            },
        });
        return response.data.instagram_business_account?.id;
    }
}
