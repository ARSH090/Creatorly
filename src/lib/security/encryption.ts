import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.META_APP_SECRET ?
    crypto.createHash('sha256').update(process.env.META_APP_SECRET).digest() :
    crypto.randomBytes(32);

// Aliases for global standardization
export const encryptToken = encryptTokenGCM;
export const decryptToken = (hash: string): string => {
    // Check if it's the old format (iv:encrypted) or new GCM data
    if (hash.includes(':')) {
        // Fallback for legacy tokens until migrated
        const [ivHex, encryptedText] = hash.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    throw new Error('For GCM tokens, use decryptTokenGCM directly with data, iv, and tag');
};

/**
 * Encrypts sensitive tokens using AES-256-GCM
 * Returns { encryptedData, iv, tag }
 */
export function encryptTokenGCM(text: string): { encryptedData: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag
    };
}

/**
 * Decrypts tokens using AES-256-GCM
 */
export function decryptTokenGCM(encryptedData: string, ivHex: string, tagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
