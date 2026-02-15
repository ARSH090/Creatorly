
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface ApiError {
    error: string;
    details?: any;
    code?: string;
}

// Success response helper
export function successResponse<T>(
    data: T,
    message?: string,
    meta?: any
): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
        meta,
    };
}

// Error response helper
export function errorResponse(
    error: string,
    details?: any,
    code?: string
): ApiError {
    return {
        error,
        details,
        code,
    };
}
