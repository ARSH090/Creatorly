import crypto from 'crypto';
import { DownloadToken } from '@/lib/models/DownloadToken';
import type { IDownloadToken } from '@/lib/models/DownloadToken';

/**
 * Generate a secure download token for purchased products
 * Tokens are time-limited and download-count-limited for security
 */
export async function generateDownloadToken(
    orderId: string,
    productId: string,
    maxDownloads: number = 3,
    expiryDays: number = 30
): Promise<IDownloadToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    return await DownloadToken.create({
        token,
        orderId,
        productId,
        maxDownloads,
        downloadCount: 0,
        expiresAt,
        isActive: true
    });
}

/**
 * Validate download token and check limits
 * Returns null if invalid/expired, otherwise returns token document
 */
export async function validateDownloadToken(tokenString: string): Promise<{
    valid: boolean;
    token?: IDownloadToken;
    error?: string;
}> {
    const token = await DownloadToken.findOne({ token: tokenString, isActive: true });

    if (!token) {
        return { valid: false, error: 'Invalid or deactivated token' };
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return { valid: false, error: 'Download link has expired' };
    }

    if (token.maxDownloads && token.downloadCount >= token.maxDownloads) {
        return { valid: false, error: `Maximum downloads (${token.maxDownloads}) reached` };
    }

    return { valid: true, token };
}

/**
 * Increment download count for a token
 */
export async function incrementDownloadCount(tokenString: string): Promise<void> {
    await DownloadToken.updateOne(
        { token: tokenString },
        { $inc: { downloadCount: 1 }, $set: { lastDownloadedAt: new Date() } }
    );
}

/**
 * Deactivate a download token (e.g., on refund)
 */
export async function deactivateDownloadToken(orderId: string): Promise<void> {
    await DownloadToken.updateMany(
        { orderId },
        { $set: { isActive: false } }
    );
}

/**
 * Get download statistics for an order
 */
export async function getDownloadStats(orderId: string): Promise<{
    totalDownloads: number;
    activeTokens: number;
}> {
    const tokens = await DownloadToken.find({ orderId });

    return {
        totalDownloads: tokens.reduce((sum, t) => sum + t.downloadCount, 0),
        activeTokens: tokens.filter(t => t.isActive).length
    };
}

/**
 * Clean up expired tokens (run as cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await DownloadToken.deleteMany({
        expiresAt: { $lt: new Date() },
        isActive: false
    });

    return result.deletedCount || 0;
}
