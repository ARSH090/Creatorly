import axios from 'axios';
import { connectToDatabase } from '../db/mongodb';
import { SocialAccount } from '../models/SocialAccount';
import { decryptTokenGCM } from '../security/encryption';

const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0';

/**
 * Service to monitor and manage social tokens
 */
export class TokenManagerService {
    /**
     * Periodically check tokens or check on-demand
     */
    static async validateToken(accountId: string) {
        await connectToDatabase();
        const account = await SocialAccount.findById(accountId);
        if (!account) return;

        if (!account.pageAccessToken || !account.tokenIV || !account.tokenTag) {
            console.warn('TokenManager: missing encryption fields for account', accountId);
            return;
        }

        const token = decryptTokenGCM(account.pageAccessToken, account.tokenIV, account.tokenTag);

        try {
            await axios.get(`${GRAPH_BASE_URL}/me`, {
                params: { access_token: token, fields: 'id' }
            });

            account.tokenStatus = 'valid';
            account.lastTokenCheck = new Date();
            await account.save();
        } catch (error: any) {
            console.error(`Token validation failed for ${accountId}:`, error.response?.data || error.message);

            const errorCode = error.response?.data?.error?.code;
            if (errorCode === 190 || errorCode === 102) {
                // Token expired or invalid
                account.tokenStatus = 'expired';
                account.isActive = false; // Disable automation until re-auth
                await account.save();

                // TODO: Trigger in-app notification to creator
            }
        }
    }

    /**
     * Notifies all creators with expired tokens
     */
    static async checkAllTokens() {
        await connectToDatabase();
        const accounts = await SocialAccount.find({ isActive: true });
        for (const account of accounts) {
            await this.validateToken(account._id.toString());
        }

    }
}
