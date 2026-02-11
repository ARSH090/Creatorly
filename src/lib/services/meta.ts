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
     * Sends a DM to an Instagram user with exponential backoff retry logic
     */
    static async sendDirectMessage(params: {
        recipientId: string;
        message: string;
        accessToken: string;
    }, attempt = 1): Promise<MetaMessageResponse> {
        const MAX_ATTEMPTS = 3;
        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/me/messages`,
                {
                    recipient: { id: params.recipientId },
                    message: { text: params.message },
                },
                {
                    params: { access_token: params.accessToken },
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return response.data;
        } catch (error: any) {
            const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED';

            if (isRetryable && attempt < MAX_ATTEMPTS) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s...
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.sendDirectMessage(params, attempt + 1);
            }

            console.error(`Meta API Error (Attempt ${attempt}):`, error.response?.data || error.message);
            throw new Error(error.response?.data?.error?.message || 'Failed to send Meta message after retries');
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
