'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (POSTHOG_KEY) {
            posthog.init(POSTHOG_KEY, {
                api_host: POSTHOG_HOST,
                person_profiles: 'identified_only',
                capture_pageview: false, // Disable automatic pageview capture, as we capture manually
            });
        }
    }, []);

    if (!POSTHOG_KEY) {
        return <>{children}</>;
    }

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
