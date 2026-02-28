import { NextResponse } from 'next/server';

/**
 * Consistent API response helpers.
 * Every API route should return these exact shapes.
 */

interface SuccessResponseOptions<T> {
    data: T;
    message?: string;
    status?: number;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
    };
}

interface ErrorResponseOptions {
    error: string;
    message?: string;
    status?: number;
    details?: any;
}

/** Standard success response */
export function apiSuccess<T>({ data, message, status = 200, meta }: SuccessResponseOptions<T>) {
    return NextResponse.json(
        { success: true, data, message: message || 'OK', ...(meta ? { meta } : {}) },
        { status }
    );
}

/** Standard created (201) response */
export function apiCreated<T>(data: T, message = 'Created successfully') {
    return apiSuccess({ data, message, status: 201 });
}

/** Standard error response */
export function apiError({ error, message, status = 400, details }: ErrorResponseOptions) {
    return NextResponse.json(
        { success: false, error, message: message || error, ...(details ? { details } : {}) },
        { status }
    );
}

/** 401 Unauthorized */
export function apiUnauthorized(message = 'Authentication required') {
    return apiError({ error: 'UNAUTHORIZED', message, status: 401 });
}

/** 403 Forbidden */
export function apiForbidden(message = 'Access denied') {
    return apiError({ error: 'FORBIDDEN', message, status: 403 });
}

/** 404 Not Found */
export function apiNotFound(resource = 'Resource') {
    return apiError({ error: 'NOT_FOUND', message: `${resource} not found`, status: 404 });
}

/** 409 Conflict */
export function apiConflict(message = 'Resource already exists') {
    return apiError({ error: 'CONFLICT', message, status: 409 });
}

/** 429 Rate Limited */
export function apiRateLimited(message = 'Too many requests') {
    return apiError({ error: 'RATE_LIMITED', message, status: 429 });
}

/** 500 Internal Server Error (generic) */
export function apiServerError(message = 'Internal server error') {
    return apiError({ error: 'SERVER_ERROR', message, status: 500 });
}

/** Pagination helper — returns meta object for list endpoints */
export function paginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
    };
}

/** Parse pagination params from URL search params with safe defaults */
export function parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
