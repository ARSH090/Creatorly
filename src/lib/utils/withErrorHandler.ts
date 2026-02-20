import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function withErrorHandler(handler: Function) {
    return async (...args: any[]) => {
        try {
            return await handler(...args);
        } catch (error: any) {
            console.error('API Error:', error);

            // Handle Zod Validation Errors
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        error: 'Validation Failed',
                        details: (error as ZodError).issues.map((e: any) => ({ path: e.path, message: e.message }))
                    },
                    { status: 400 }
                );
            }

            // Handle Mongoose Duplicate Key Error
            if (error.code === 11000) {
                return NextResponse.json(
                    { error: 'Duplicate entry: A record with this information already exists.' },
                    { status: 409 }
                );
            }

            // Standard Error Response
            const status = error.status || 500;
            const message = error.message || 'Internal Server Error';

            return NextResponse.json(
                { error: message },
                { status }
            );
        }
    };
}
