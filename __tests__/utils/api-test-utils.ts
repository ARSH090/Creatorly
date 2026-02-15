import { NextRequest } from 'next/server';
import { sign } from 'jsonwebtoken';

/**
 * Creates a NextRequest object for use in Next.js API route handlers
 */
export function createTestRequest(options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
}) {
    const { method = 'GET', url = 'http://localhost:3000/api/test', headers = {}, body } = options;

    const req = new NextRequest(new URL(url), {
        method,
        headers: new Headers(headers),
        body: body ? JSON.stringify(body) : undefined,
    });

    return req;
}

/**
 * Generates a mock JWT token for testing auth guards
 */
export function generateTestToken(userId: string, role: string = 'customer') {
    return sign(
        {
            uid: 'test-firebase-uid',
            userId,
            role,
            email: 'test@example.com'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
}

/**
 * Creates an authenticated NextRequest
 */
export async function authenticatedRequest(options: {
    method?: string;
    url?: string;
    body?: any;
    userId?: string;
    role?: string;
}) {
    const token = generateTestToken(options.userId || 'test-user-id', options.role || 'customer');

    return createTestRequest({
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
}
