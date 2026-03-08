import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Validates and limits CSS input size.
 * In a production setting involving direct <style> tags, it is safest to ensure
 * no HTML escapes </style> to inject malicious scripts into the document.
 */
export function sanitizeCustomCss(css: string): string {
    if (!css || typeof css !== 'string') return '';

    // Limit to 50KB length
    if (css.length > 50000) {
        throw new Error('Custom CSS exceeds maximum allowed size (50KB).');
    }

    // Removing enclosing HTML tags if the user accidentally pasted them
    let clean = css.replace(/<\/?style[^>]*>/gi, '');

    // Critical security measure to prevent breaking out of the injected <style> block
    clean = clean.replace(/<\/style>/gi, '\\<\\/style>');
    clean = clean.replace(/<script[^>]*>/gi, '');
    clean = clean.replace(/<\/script>/gi, '\\<\\/script>');

    // Disallow external CSS imports unless deemed safe.
    // Basic blocker for malicious exfiltration/tracking:
    clean = clean.replace(/@import.*['"]?(http|javascript|data):.*['"]?;?/gi, '/* Import Blocked */');
    clean = clean.replace(/url\(['"]?(javascript|data):.*['"]?\)/gi, 'url(none)');

    // Further sanitization could be done via DOMPurify passing the string as style context, 
    // but standard CSS parses safely as long as it cannot escape the <style> block.

    return clean;
}
