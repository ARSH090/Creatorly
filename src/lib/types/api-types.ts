import { NextRequest, NextResponse } from 'next/server';
import { IUser } from '../models/User';

/**
 * Standardized API Handler type for Creatorly
 */
export type ApiHandler = (
    req: NextRequest,
    user: IUser,
    context: any
) => Promise<Response>;

/**
 * Standardized Route Handler type for Next.js 15+
 */
export type RouteHandler<T extends Record<string, string> = any> = (
    req: NextRequest,
    context: { params: Promise<T> }
) => Promise<Response>;

export type SuccessResponse<T = any> = {
    success: true;
    data: T;
    message?: string;
};

export type ErrorResponse = {
    success: false;
    error: string;
    code?: string;
};
