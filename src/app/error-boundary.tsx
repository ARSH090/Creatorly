'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global Error Boundary & Sentry Integrator
 * Captures all unhandled runtime errors and reports them to Sentry.
 */
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const handleError = (error: Error | any) => {
            // Avoid reporting trivial or expected errors if needed
            if (!error) return;

            Sentry.captureException(error);
            console.error('[GlobalError] Captured:', error);
        };

        // 1. Capture basic window errors
        const onWindowError = (event: ErrorEvent) => handleError(event.error);

        // 2. Capture unhandled promise rejections
        const onUnhandledRejection = (event: PromiseRejectionEvent) => handleError(event.reason);

        window.addEventListener('error', onWindowError);
        window.addEventListener('unhandledrejection', onUnhandledRejection);

        return () => {
            window.removeEventListener('error', onWindowError);
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
        };
    }, []);

    return <>{children}</>;
}
