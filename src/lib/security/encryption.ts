import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.META_APP_SECRET ?
    crypto.createHash('sha256').update(process.env.META_APP_SECRET).digest() :
    crypto.randomBytes(32); // Fallback for build time safety

/**
 * Encrypts sensitive tokens for DB storage
 * @param text Raw token string
 */
export function encryptToken(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts tokens for API usage
 * @param hash Encrypted string in format iv:encrypted
 */
export function decryptToken(hash: string): string {
    const [ivHex, encryptedText] = hash.split(':');
    if (!ivHex || !encryptedText) throw new Error('Invalid encryption format');

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
