import { adminAuth } from './admin';
import { User } from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface AuthenticatedUser {
    firebaseUid: string;
    mongoUser: any;
    decodedToken: any;
}

/**
 * Verifies Firebase ID token and syncs user to MongoDB
 * @param token Firebase ID token from client
 * @returns Authenticated user with Firebase UID and MongoDB user data
 */
export async function verifyFirebaseToken(
    token: string
): Promise<AuthenticatedUser | null> {
    try {
        if (!adminAuth) {
            console.error('Firebase Admin not initialized');
            return null;
        }

        // Verify Firebase ID token
        const decodedToken = await adminAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        // Connect to MongoDB
        await connectToDatabase();

        // Lookup MongoDB user by Firebase UID
        let mongoUser = await User.findOne({ firebaseUid }).lean();

        if (!mongoUser) {
            // First-time login: sync Firebase user to MongoDB
            mongoUser = await User.create({
                firebaseUid,
                authProvider: decodedToken.firebase.sign_in_provider === 'google.com' ? 'google' : 'password',
                email: decodedToken.email || '',
                username: decodedToken.email?.split('@')[0] || `user_${Date.now()}`,
                displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                avatar: decodedToken.picture,
                role: 'user',
                emailVerified: decodedToken.email_verified || false,
                emailVerifiedAt: decodedToken.email_verified ? new Date() : undefined,
            } as any);
        }

        return { firebaseUid, mongoUser, decodedToken };
    } catch (error) {
        console.error('Firebase token verification failed:', error);
        return null;
    }
}
