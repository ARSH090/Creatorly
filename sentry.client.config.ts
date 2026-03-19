import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN, // Will be undefined on client if not prefixed, which is intended for security.
    integrations: [
        Sentry.replayIntegration(),
    ],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Tracing
    tracesSampleRate: 1.0,
    debug: false,
});
