// Dangerous file extensions to block
export const BLOCKED_FILE_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jse',
    '.jar', '.zip', '.rar', '.7z', '.tar', '.gz', '.sh', '.bash', '.ps1',
    '.php', '.asp', '.aspx', '.jsp', '.cgi', '.py', '.rb', '.pl', '.app',
    '.deb', '.rpm', '.dmg', '.pkg', '.msi', '.dll', '.so', '.dylib',
];

// Dangerous MIME types to block
export const BLOCKED_MIME_TYPES = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-executable',
    'application/x-sh',
    'text/x-shellscript',
    'application/x-php',
    'text/x-php',
    'application/x-httpd-php',
    'application/javascript',
    'text/javascript',
    'application/x-python-code',
    'text/x-python',
    'application/x-perl',
    'text/x-perl',
];

// Allowed MIME types for products/uploads
export const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    // Archives (for digital products)
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
];

export function getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

export function isBlockedExtension(filename: string): boolean {
    const ext = getFileExtension(filename);
    return BLOCKED_FILE_EXTENSIONS.includes(ext);
}

export function isBlockedMimeType(mimeType: string): boolean {
    return BLOCKED_MIME_TYPES.includes(mimeType.toLowerCase());
}

export function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

export function validateFileUpload(filename: string, mimeType: string): { valid: boolean; error?: string } {
    // Check extension
    if (isBlockedExtension(filename)) {
        return {
            valid: false,
            error: `File type not allowed: ${getFileExtension(filename)}`,
        };
    }

    // Check MIME type
    if (isBlockedMimeType(mimeType)) {
        return {
            valid: false,
            error: 'File type not allowed',
        };
    }

    if (!isAllowedMimeType(mimeType)) {
        return {
            valid: false,
            error: `MIME type not supported: ${mimeType}`,
        };
    }

    // Check for extension/MIME mismatch (e.g., .exe renamed to .jpg)
    const ext = getFileExtension(filename);
    const expectedMimes = getMimeTypesForExtension(ext);

    if (expectedMimes.length > 0 && !expectedMimes.includes(mimeType.toLowerCase())) {
        return {
            valid: false,
            error: 'File extension does not match content type',
        };
    }

    return { valid: true };
}

function getMimeTypesForExtension(ext: string): string[] {
    const mimeMap: Record<string, string[]> = {
        '.jpg': ['image/jpeg'],
        '.jpeg': ['image/jpeg'],
        '.png': ['image/png'],
        '.gif': ['image/gif'],
        '.webp': ['image/webp'],
        '.svg': ['image/svg+xml'],
        '.pdf': ['application/pdf'],
        '.doc': ['application/msword'],
        '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        '.xls': ['application/vnd.ms-excel'],
        '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        '.ppt': ['application/vnd.ms-powerpoint'],
        '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        '.txt': ['text/plain'],
        '.csv': ['text/csv'],
        '.mp3': ['audio/mpeg'],
        '.wav': ['audio/wav'],
        '.mp4': ['video/mp4', 'audio/mp4'],
        '.zip': ['application/zip', 'application/x-zip-compressed'],
        '.rar': ['application/x-rar-compressed'],
        '.7z': ['application/x-7z-compressed'],
    };

    return mimeMap[ext] || [];
}
