import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
function getEncryptionKeyCurrent(): Buffer {
    const secret = process.env.TOKEN_ENCRYPTION_KEY_CURRENT || process.env.META_APP_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL: TOKEN_ENCRYPTION_KEY_CURRENT or META_APP_SECRET is required.');
        }
        return crypto.createHash('sha256').update('dev-placeholder-key').digest();
    }
    if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
        return Buffer.from(secret, 'hex');
    }
    return crypto.createHash('sha256').update(secret).digest();
}

function getEncryptionKeyPrevious(): Buffer | null {
    const secret = process.env.TOKEN_ENCRYPTION_KEY_PREVIOUS;
    if (!secret) return null;
    if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
        return Buffer.from(secret, 'hex');
    }
    return crypto.createHash('sha256').update(secret).digest();
}

function getLegacyKey(): Buffer {
    const secret = process.env.META_APP_SECRET;
    if (!secret) return getEncryptionKeyCurrent();
    return crypto.createHash('sha256').update(secret).digest();
}

// Aliases for global standardization
export const decryptToken = (hash: string): string => {
    if (hash.includes(':')) {
        const [ivHex, encryptedText] = hash.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', getLegacyKey(), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    throw new Error('For GCM tokens, use decryptTokenWithVersion');
};

/**
 * Encrypts with the current dynamic key version
 */
export function encryptTokenWithVersion(text: string): { encryptedData: string; iv: string; tag: string; keyVersion: string } {
    const result = encryptTokenGCM(text, getEncryptionKeyCurrent());
    return { ...result, keyVersion: 'v1' };
}

/**
 * Decrypts using a specific key version
 */
export function decryptTokenWithVersion(encryptedData: string, ivHex: string, tagHex: string, keyVersion: string = 'legacy'): string {
    let key: Buffer;

    if (keyVersion === 'v1') {
        key = getEncryptionKeyCurrent();
    } else if (keyVersion === 'legacy') {
        key = getLegacyKey();
    } else if (keyVersion === 'previous') {
        const prevKey = getEncryptionKeyPrevious();
        if (!prevKey) throw new Error('Previous encryption key not found in environment');
        key = prevKey;
    } else {
        throw new Error(`Unknown encryption key version: ${keyVersion}`);
    }

    return decryptTokenGCM(encryptedData, ivHex, tagHex, key);
}


export function encryptTokenGCM(text: string, key: Buffer = getEncryptionKeyCurrent()): { encryptedData: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag
    };
}

export function decryptTokenGCM(encryptedData: string, ivHex: string, tagHex: string, key: Buffer = getEncryptionKeyCurrent()): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ─── Simple string based AES-256-GCM wrappers for Instagram Tokens ────────
const ENCRYPTION_KEY_STRING = process.env.ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY_CURRENT || '00000000000000000000000000000000'; // Fallback for type safety, must be 32 chars
const INSTA_ALGORITHM = 'aes-256-gcm';

export function encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    // Pad or truncate to ensure exactly 32 bytes for aes-256
    const keyBuffer = Buffer.alloc(32);
    keyBuffer.write(ENCRYPTION_KEY_STRING, 'utf-8');

    const cipher = crypto.createCipheriv(INSTA_ALGORITHM, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptStringToken(encryptedToken: string): string {
    const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const keyBuffer = Buffer.alloc(32);
    keyBuffer.write(ENCRYPTION_KEY_STRING, 'utf-8');

    const decipher = crypto.createDecipheriv(INSTA_ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

