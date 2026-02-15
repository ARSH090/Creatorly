import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
    }).trim();
}

/**
 * Sanitize HTML content (for rich text editors)
 */
export function sanitizeHTML(html: string): string {
    if (typeof html !== 'string') return '';
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'target'],
    });
}

/**
 * Prevent MongoDB injection
 * Recursively sanitizes object keys starting with '$'
 */
export function sanitizeMongoQuery(query: any): any {
    if (typeof query !== 'object' || query === null) {
        return query;
    }

    if (Array.isArray(query)) {
        return query.map(sanitizeMongoQuery);
    }

    const sanitized: any = {};

    for (const key in query) {
        if (key.startsWith('$')) {
            continue; // Skip MongoDB operators from user input
        }

        sanitized[key] = sanitizeMongoQuery(query[key]);
    }

    return sanitized;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim();
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return '';
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 255);
}
