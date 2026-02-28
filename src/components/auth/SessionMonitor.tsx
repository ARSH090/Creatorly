'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function SessionMonitor() {
    const { signOut } = useClerk();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log('Session expired due to inactivity');
            signOut();
        }, INACTIVITY_TIMEOUT);
    }, [signOut]);

    useEffect(() => {
        // Events that indicate user activity
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial timeout
        resetTimeout();

        const handleActivity = () => resetTimeout();

        activities.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            activities.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimeout]);

    return null; // This is a headless monitor
}
