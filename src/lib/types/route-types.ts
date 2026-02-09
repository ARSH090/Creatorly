import { NextRequest } from 'next/server';

/**
 * Next.js 15+ route context with async params
 */
export type RouteContext<T extends Record<string, string>> = {
    params: Promise<T>;
};

/**
 * Helper type for dynamic route handlers
 */
export type DynamicRouteHandler<T extends Record<string, string>> = (
    request: NextRequest,
    context: RouteContext<T>
) => Promise<Response>;
