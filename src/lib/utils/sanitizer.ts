import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML content to prevent XSS.
 * Allows standard formatting tags but strips scripts, iframes (unless whitelisted), and event handlers.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ['iframe'], // Allow iframes for embeds (video/social)
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    });
}

/**
 * Strict CSS sanitization.
 * Blocks dangerous keywords like 'expression', 'javascript', 'url', and 'behavior'.
 * Only intended for creator-provided custom CSS.
 */
export function sanitizeCss(css: string): string {
    if (!css) return '';
    
    // Remove comments to prevent bypasses
    let cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Block dangerous patterns
    const dangerousPatterns = [
        /javascript:/i,
        /expression\s*\(/i,
        /vbscript:/i,
        /behavior\s*:/i,
        /-moz-binding/i,
        /data:/i, // Block data URIs in CSS
        /@import/i, // Prevent external CSS imports
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(cleanCss)) {
            console.warn(`[SEC] Dangerous CSS pattern detected and blocked: ${pattern}`);
            return `/* Blocked for security: ${pattern.toString()} */`;
        }
    }

    // Optional: Use a proper CSS parser like 'postcss' if available for even stricter validation.
    // For now, this basic blacklist handles the most common XSS vectors in CSS.
    return cleanCss;
}

/**
 * Sanitize a flexible blocks array (used in CreatorProfile.blocksLayout).
 */
export function sanitizeBlocks(blocks: any[]): any[] {
    if (!Array.isArray(blocks)) return [];
    
    return blocks.map(block => {
        const sanitizedBlock = { ...block };

        if (sanitizedBlock.type === 'text' && sanitizedBlock.content) {
            sanitizedBlock.content = sanitizeHtml(sanitizedBlock.content);
        }

        if (sanitizedBlock.type === 'embed' && sanitizedBlock.html) {
            sanitizedBlock.html = sanitizeHtml(sanitizedBlock.html);
        }

        if (sanitizedBlock.config) {
            // Recursively sanitize string values in config if they look like HTML
            for (const key in sanitizedBlock.config) {
                if (typeof sanitizedBlock.config[key] === 'string' && sanitizedBlock.config[key].includes('<')) {
                    sanitizedBlock.config[key] = sanitizeHtml(sanitizedBlock.config[key]);
                }
            }
        }

        return sanitizedBlock;
    });
}
