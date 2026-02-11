import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Standardizes HTML rendering with strict sanitization
 * Prevents XSS while allowing basic formatting tags
 */
export function sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });
}
