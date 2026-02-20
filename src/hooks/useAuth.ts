
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';

export function useAuth() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();

    return {
        user: user,
        loading: !isLoaded,
        isAuthenticated: isSignedIn,
        isAdmin: user?.publicMetadata?.role === 'admin',
        signOut,
        refreshUser: async () => {
            if (user) await user.reload();
        },
        // Mocking legacy fields if needed, or better to remove them if not used
        uid: user?.id,
        email: user?.primaryEmailAddress?.emailAddress,
        displayName: user?.fullName || user?.username,
        photoURL: user?.imageUrl
    };
}
