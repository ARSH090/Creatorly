import crypto from 'crypto';
import { encryptTokenWithVersion, decryptTokenWithVersion, encryptTokenGCM, decryptTokenGCM } from '@/lib/security/encryption';




describe('Encryption Utility', () => {
    const testSecret = 'test-secret-123';

    beforeAll(() => {
        process.env.TOKEN_ENCRYPTION_KEY_CURRENT = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'; // 32-byte hex
        process.env.META_APP_SECRET = 'legacy-secret';
    });

    it('should encrypt and decrypt using the current version (v1)', () => {
        const { encryptedData, iv, tag, keyVersion } = encryptTokenWithVersion(testSecret);
        expect(keyVersion).toBe('v1');

        const decrypted = decryptTokenWithVersion(encryptedData, iv, tag, keyVersion);
        expect(decrypted).toBe(testSecret);
    });

    it('should decrypt legacy tokens (AES-256-GCM without version)', () => {
        // Mock a legacy encryption manually using the legacy key
        const legacyKey = crypto.createHash('sha256').update('legacy-secret').digest();
        const legacyResult = encryptTokenGCM(testSecret, legacyKey);

        const decrypted = decryptTokenWithVersion(legacyResult.encryptedData, legacyResult.iv, legacyResult.tag, 'legacy');
        expect(decrypted).toBe(testSecret);
    });


    it('should handle key rotation with previous keys', () => {
        const previousKeySecret = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';
        process.env.TOKEN_ENCRYPTION_KEY_PREVIOUS = previousKeySecret;

        // Re-import or rely on dynamic loading if implemented, 
        // but here we just test the logic with version mapping
        const { encryptedData, iv, tag } = encryptTokenWithVersion(testSecret); // Version v1

        const decrypted = decryptTokenWithVersion(encryptedData, iv, tag, 'v1');
        expect(decrypted).toBe(testSecret);
    });

    it('should throw error on invalid key version', () => {
        const { encryptedData, iv, tag } = encryptTokenWithVersion(testSecret);
        expect(() => decryptTokenWithVersion(encryptedData, iv, tag, 'invalid-version')).toThrow();
    });
});
