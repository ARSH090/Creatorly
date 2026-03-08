/**
 * Validates tracking pixel IDs using basic standard format regexes.
 * This prevents users from injecting arbitrary scripts pretending to be IDs.
 */
export function validatePixelIds(pixels: Record<string, string | undefined>) {
    const validated: Record<string, string> = {};

    if (pixels.metaPixelId) {
        // Meta pixel IDs are generally 15-16 digit numbers
        if (/^\d{10,20}$/.test(pixels.metaPixelId)) {
            validated.metaPixelId = pixels.metaPixelId;
        } else {
            throw new Error('Invalid Meta Pixel ID format. Should be 10-20 digits.');
        }
    }

    if (pixels.tiktokPixelId) {
        // TikTok pixels are usually alphanumeric strings ~20-30 chars
        if (/^[a-zA-Z0-9_-]{10,40}$/.test(pixels.tiktokPixelId)) {
            validated.tiktokPixelId = pixels.tiktokPixelId;
        } else {
            throw new Error('Invalid TikTok Pixel ID format.');
        }
    }

    if (pixels.ga4MeasurementId) {
        // GA4 measurement IDs start with G- followed by alphanumeric characters
        if (/^G-[a-zA-Z0-9]{5,15}$/.test(pixels.ga4MeasurementId)) {
            validated.ga4MeasurementId = pixels.ga4MeasurementId;
        } else {
            throw new Error('Invalid GA4 Measurement ID format. Should start with G-.');
        }
    }

    if (pixels.snapchatPixelId) {
        // Snapchat pixel IDs follow UUID v4 format or similar alphanumeric format
        if (/^[a-fA-F0-9-]{36}$|^[a-zA-Z0-9-]{15,40}$/.test(pixels.snapchatPixelId)) {
            validated.snapchatPixelId = pixels.snapchatPixelId;
        } else {
            throw new Error('Invalid Snapchat Pixel ID format.');
        }
    }

    return validated;
}
