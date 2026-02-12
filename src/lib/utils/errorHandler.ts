import { NextResponse } from 'next/server';

/**
 * Standardized error response structure
 */
export interface APIError {
    code: string;
    message: string;
    details?: any;
    upgradeUrl?: string;
}

/**
 * Standardized success response structure
 */
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: APIError;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        timestamp?: string;
    };
}

/**
 * Wrap API route handlers with error handling and response standardization
 * Usage: export const GET = withErrorHandler(async (req, user) => { ... });
 */
export function withErrorHandler<T = any>(
    handler: (...args: any[]) => Promise<T | Response>
) {
    return async (...args: any[]) => {
        try {
            const result = await handler(...args);

            // If handler returns a Response, pass it through
            if (result instanceof Response) {
                return result;
            }

            // Otherwise wrap in standardized format
            return NextResponse.json<APIResponse<T>>({
                success: true,
                data: result,
                meta: {
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error: any) {
            console.error('API Error:', error);

            // Handle known error types
            if (error.name === 'ValidationError') {
                return NextResponse.json<APIResponse>({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: error.errors || error.message
                    }
                }, { status: 400 });
            }

            if (error.name === 'UnauthorizedError' || error.code === 'UNAUTHORIZED') {
                return NextResponse.json<APIResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: error.message || 'Authentication required'
                    }
                }, { status: 401 });
            }

            if (error.code === 'LIMIT_REACHED' || error.code === 'FEATURE_NOT_AVAILABLE') {
                return NextResponse.json<APIResponse>({
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        upgradeUrl: '/dashboard/billing'
                    }
                }, { status: 403 });
            }

            if (error.name === 'MongoError' && error.code === 11000) {
                return NextResponse.json<APIResponse>({
                    success: false,
                    error: {
                        code: 'DUPLICATE_ENTRY',
                        message: 'A record with this value already exists',
                        details: error.keyPattern
                    }
                }, { status: 409 });
            }

            // Generic server error
            return NextResponse.json<APIResponse>({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: process.env.NODE_ENV === 'production'
                        ? 'An unexpected error occurred'
                        : error.message
                }
            }, { status: 500 });
        }
    };
}

/**
 * Create a custom API error
 */
export class APIErrorClass extends Error {
    code: string;
    details?: any;
    statusCode: number;

    constructor(code: string, message: string, details?: any, statusCode: number = 400) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
    }
}

/**
 * Helper to throw common errors
 */
export const throwError = {
    notFound: (resource: string) => {
        throw new APIErrorClass('NOT_FOUND', `${resource} not found`, undefined, 404);
    },
    unauthorized: (message = 'Unauthorized') => {
        throw new APIErrorClass('UNAUTHORIZED', message, undefined, 401);
    },
    forbidden: (message = 'Forbidden') => {
        throw new APIErrorClass('FORBIDDEN', message, undefined, 403);
    },
    badRequest: (message: string, details?: any) => {
        throw new APIErrorClass('BAD_REQUEST', message, details, 400);
    },
    limitReached: (message: string, current: number, limit: number) => {
        throw new APIErrorClass('LIMIT_REACHED', message, { current, limit }, 403);
    },
    featureNotAvailable: (feature: string, requiredPlan: string) => {
        throw new APIErrorClass(
            'FEATURE_NOT_AVAILABLE',
            `This feature requires ${requiredPlan} plan`,
            { feature, requiredPlan },
            403
        );
    }
};
