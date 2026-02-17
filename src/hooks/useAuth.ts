import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';

export function useAuth() {
    const { user, isLoaded } = useUser();
    const { getToken } = useClerkAuth();
    const { signOut } = useClerk();

    // Map Clerk user to Firebase-like structure for backward compatibility
    const firebaseCompatibleUser = user ? {
        uid: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName: user.fullName || user.username || user.firstName,
        photoURL: user.imageUrl,
        username: user.username,
        // Helper to get token (some components might use user.getIdToken())
        getIdToken: async () => getToken(),
    } : null;

    const refreshUser = async () => {
        if (user) {
            await user.reload();
        }
    };

    return {
        user: firebaseCompatibleUser,
        loading: !isLoaded,
        signOut,
        getToken,
        isAuthenticated: !!user,
        refreshUser,
    };
}
