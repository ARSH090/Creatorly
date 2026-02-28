/**
 * XSS Sanitization Utility
 * Uses isomorphic-dompurify (works on both server and client)
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-provided HTML/text content to prevent XSS.
 * Use on ALL user-generated content before rendering or storing.
 */
export function sanitize(input: string): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
    });
}

/**
 * Strip all HTML tags — for plain text fields like names, usernames.
 */
export function sanitizePlainText(input: string): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Validate password strength server-side.
 * Min 8 chars, at least 1 number and 1 special character.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number.' };
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one special character.' };
    }
    return { valid: true };
}
