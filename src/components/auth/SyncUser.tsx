'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SyncUser() {
    const { isSignedIn, user } = useUser();

    useEffect(() => {
        if (isSignedIn && user) {
            // Call sync API
            fetch('/api/auth/sync', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.error) console.error("User Sync Failed:", data.error);
                })
                .catch(err => console.error("User Sync Error:", err));
        }
    }, [isSignedIn, user]);

    return null; // Invisible component
}
