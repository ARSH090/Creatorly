import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

const GRAPH_BASE_URL = 'https://graph.facebook.com';
const VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

export interface InstagramSendResult {
    success: boolean;
    messageId?: string;
    recipientId?: string;
    error?: string;
    errorCode?: string;
    isRetryable?: boolean;
}

export interface InstagramUserInfo {
    id: string;
    username: string;
    name?: string;
}

/**
 * Instagram Direct Message Service
 * Handles sending DMs via Instagram Graph API
 * with rate limiting, circuit breaker, and retry logic
 */
export class InstagramService {
    private static circuitBreakerFailureCount = 0;
    private static circuitBreakerOpen = false;
    private static circuitBreakerResetTime = 0;
    private static readonly CIRCUIT_BREAKER_THRESHOLD = 5;
    private static readonly CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute

    /**
     * Check if circuit breaker is open
     */
    private static isCircuitBreakerOpen(): boolean {
        if (this.circuitBreakerOpen) {
            if (Date.now() > this.circuitBreakerResetTime) {
                // Half-open: try a single request
                this.circuitBreakerFailureCount = 0;
                this.circuitBreakerOpen = false;
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * Record circuit breaker failure
     */
    private static recordCircuitBreakerFailure(): void {
        this.circuitBreakerFailureCount++;
        if (this.circuitBreakerFailureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
            this.circuitBreakerOpen = true;
            this.circuitBreakerResetTime = Date.now() + this.CIRCUIT_BREAKER_RESET_MS;
            console.error('[InstagramService] Circuit breaker opened due to repeated failures');
        }
    }

    /**
     * Exchange OAuth code for a short-lived user access token
     */
    static async exchangeCodeForToken(code: string, appId: string, appSecret: string, redirectUri: string): Promise<string | null> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/oauth/access_token`,
                {
                    params: {
                        client_id: appId,
                        client_secret: appSecret,
                        redirect_uri: redirectUri,
                        code: code,
                    },
                }
            );
            return response.data?.access_token || null;
        } catch (error) {
            console.error('[InstagramService] Code exchange failed:', error);
            return null;
        }
    }

    /**
     * Exchange short-lived token for a long-lived user access token (60 days)
     */
    static async getLongLivedToken(shortLivedToken: string, appId: string, appSecret: string): Promise<string | null> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/oauth/access_token`,
                {
                    params: {
                        grant_type: 'fb_exchange_token',
                        client_id: appId,
                        client_secret: appSecret,
                        fb_exchange_token: shortLivedToken,
                    },
                }
            );
            return response.data?.access_token || null;
        } catch (error) {
            console.error('[InstagramService] Long-lived token exchange failed:', error);
            return null;
        }
    }

    /**
     * Get pages managed by the user
     */
    static async getUserPages(userAccessToken: string): Promise<any[]> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/me/accounts`,
                {
                    params: {
                        access_token: userAccessToken,
                        fields: 'id,name,access_token,instagram_business_account'
                    },
                }
            );
            return response.data?.data || [];
        } catch (error) {
            console.error('[InstagramService] Failed to get user pages:', error);
            return [];
        }
    }

    /**
     * Record circuit breaker success
     */
    private static recordCircuitBreakerSuccess(): void {
        this.circuitBreakerFailureCount = 0;
    }

    /**
     * Get Instagram Business Account ID from page
     */
    static async getInstagramBusinessId(pageId: string, accessToken: string): Promise<string | null> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/${pageId}`,
                {
                    params: {
                        fields: 'instagram_business_account',
                        access_token: accessToken,
                    },
                }
            );
            return response.data.instagram_business_account?.id || null;
        } catch (error) {
            console.error('[InstagramService] Failed to get Instagram business ID:', error);
            return null;
        }
    }

    /**
     * Check if an Instagram user follows the business account
     * NOTE: Requires 'instagram_manage_comments' or 'instagram_manage_messages' and potentially 
     * specific relationship permissions depending on the account type.
     */
    static async isFollowing(igUserId: string, targetRecipientId: string, accessToken: string): Promise<boolean> {
        try {
            // Check relationship status
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/${igUserId}/ins_relationships`,
                {
                    params: {
                        access_token: accessToken,
                        user_id: targetRecipientId
                    }
                }
            );
            return response.data?.data?.[0]?.following_status === 'following';
        } catch (error) {
            console.error('[InstagramService] Follow check failed:', error);
            // Default to true to avoid blocking users if the check fails (fail-open)
            return true;
        }
    }

    /**
     * Get Instagram user ID from username
     */
    static async getInstagramUserId(username: string, accessToken: string, igUserId: string): Promise<string | null> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/IGDSUserSearch`,
                {
                    params: {
                        access_token: accessToken,
                        ig_user_id: igUserId,
                        q: username,
                    },
                }
            );
            return response.data?.users?.[0]?.id || null;
        } catch (error) {
            console.error('[InstagramService] Failed to get Instagram user ID:', error);
            return null;
        }
    }

    /**
     * Send a direct message via Instagram Graph API
     */
    static async sendDirectMessage(params: {
        recipientId: string;
        message: string;
        accessToken: string;
        igUserId: string;
    }): Promise<InstagramSendResult> {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen()) {
            return {
                success: false,
                error: 'Circuit breaker is open. Too many recent failures.',
                isRetryable: true,
            };
        }

        try {
            const response = await axios.post(
                `${GRAPH_BASE_URL}/${VERSION}/me/messages`,
                {
                    recipient: { id: params.recipientId },
                    message: { text: params.message },
                },
                {
                    params: { access_token: params.accessToken },
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000,
                }
            );

            this.recordCircuitBreakerSuccess();

            const messageId = response.data?.message_id;
            const recipientId = response.data?.recipient_id;

            console.log(`[InstagramService] DM sent successfully. MessageID: ${messageId}`);

            return {
                success: true,
                messageId,
                recipientId,
            };
        } catch (error) {
            this.recordCircuitBreakerFailure();

            const axiosError = error as AxiosError<any>;
            const status = axiosError.response?.status;
            const metaError = axiosError.response?.data?.error;

            const errorInfo = {
                status,
                message: metaError?.message || axiosError.message,
                code: metaError?.code,
                isRetryable: this.isRetryableError(status, metaError?.code),
            };

            console.error(`[InstagramService] DM send failed:`, errorInfo);

            // Handle specific error codes
            if (metaError?.code === 190) {
                // Token expired
                return {
                    success: false,
                    error: 'Access token expired',
                    errorCode: 'TOKEN_EXPIRED',
                    isRetryable: false, // Needs token refresh, not retry
                };
            }

            if (metaError?.message?.includes('User has not sent a message to this business')) {
                return {
                    success: false,
                    error: 'Recipient has not initiated conversation with this business account',
                    errorCode: 'NOT_PERMITTED',
                    isRetryable: false,
                };
            }

            if (metaError?.code === 4 || status === 429) {
                // Rate limit
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                    errorCode: 'RATE_LIMIT',
                    isRetryable: true,
                };
            }

            return {
                success: false,
                error: errorInfo.message || 'Failed to send DM',
                errorCode: metaError?.code || 'UNKNOWN_ERROR',
                isRetryable: errorInfo.isRetryable,
            };
        }
    }

    /**
     * Determine if an error is retryable
     */
    private static isRetryableError(status?: number, code?: string | number): boolean {
        if (!status) return true; // Network errors are retryable
        // 5xx errors
        if (status >= 500) return true;
        // Rate limit
        if (status === 429) return true;
        // Token errors are not retryable (need refresh)
        if (code === 190 || code === '190' || code === 'TOKEN_EXPIRED') return false;
        return false;
    }

    /**
     * Refresh long-lived access token
     */
    static async refreshAccessToken(accessToken: string, appId: string, appSecret: string): Promise<string | null> {
        try {
            // First, get a new long-lived token
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/oauth/access_token`,
                {
                    params: {
                        grant_type: 'fb_exchange_token',
                        client_id: appId,
                        client_secret: appSecret,
                        fb_exchange_token: accessToken,
                    },
                }
            );

            if (response.data?.access_token) {
                console.log('[InstagramService] Token refreshed successfully');
                return response.data.access_token;
            }

            return null;
        } catch (error) {
            console.error('[InstagramService] Token refresh failed:', error);
            return null;
        }
    }

    /**
     * Get message delivery status (requires webhooks for real-time updates)
     */
    static async getMessageStatus(messageId: string, accessToken: string): Promise<string | null> {
        try {
            const response = await axios.get(
                `${GRAPH_BASE_URL}/${VERSION}/${messageId}`,
                {
                    params: {
                        fields: 'delivery_status,read_status',
                        access_token: accessToken,
                    },
                }
            );
            return response.data?.delivery_status || null;
        } catch (error) {
            console.error('[InstagramService] Failed to get message status:', error);
            return null;
        }
    }

    /**
     * Build a dynamic DM message from template
     */
    static buildMessage(name: string, interest: string): string {
        return `Hi ${name}! Thanks for your interest in ${interest}. We're excited to help you get started. What would you like to know more about?`;
    }

    /**
     * Generate WhatsApp deep link (for placeholder)
     */
    static generateWhatsAppDeepLink(phone: string, message: string): string {
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
        try {
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch (error) {
            console.error('[InstagramService] Webhook signature verification failed:', error);
            return false;
        }
    }
}

export default InstagramService;
