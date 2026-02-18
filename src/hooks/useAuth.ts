import { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';

export interface AuthUser {
    uid: string;
    _id?: string;
    email?: string;
    displayName: string | null;
    photoURL: string;
    username: string | null;
    role?: string;
    getIdToken: () => Promise<string | null>;
}

export function useAuth() {
    const { user: clerkUser, isLoaded } = useUser();
    const { getToken } = useClerkAuth();
    const { signOut } = useClerk();
    const [mongoUser, setMongoUser] = useState<any>(null);

    useEffect(() => {
        if (clerkUser) {
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => setMongoUser(data.user))
                .catch(err => console.error('Failed to fetch Mongoose user', err));
        } else {
            setMongoUser(null);
        }
    }, [clerkUser]);

    // Map Clerk user to Mongoose-compatible structure
    const user: AuthUser | null = clerkUser ? {
        uid: clerkUser.id,
        _id: mongoUser?._id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        displayName: clerkUser.fullName || clerkUser.username || clerkUser.firstName,
        photoURL: clerkUser.imageUrl,
        username: clerkUser.username,
        role: mongoUser?.role,
        getIdToken: async () => getToken(),
    } : null;

    const refreshUser = async () => {
        if (clerkUser) {
            await clerkUser.reload();
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            setMongoUser(data.user);
        }
    };

    return {
        user,
        loading: !isLoaded || (!!clerkUser && !mongoUser),
        signOut,
        getToken,
        isAuthenticated: !!clerkUser,
        refreshUser,
    };
}
