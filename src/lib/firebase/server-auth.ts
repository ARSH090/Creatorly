import { cookies } from 'next/headers';
import { verifyFirebaseToken } from './verifyToken';
import { User } from '@/lib/models/User';

/**
 * Retrieves the currently authenticated user from cookies.
 * Intended for use in Server Components and Server Actions.
 * Replaces NextAuth's getServerSession.
 */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('authToken')?.value;

        if (!authToken) {
            return null;
        }

        const auth = await verifyFirebaseToken(authToken);

        if (!auth) {
            return null;
        }

        return auth.mongoUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Helper to check if current user is admin
 */
export async function isCurrentUserAdmin() {
    const user = await getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'super-admin');
}
