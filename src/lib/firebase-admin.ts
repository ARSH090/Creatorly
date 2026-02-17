// lib/firebase-admin.ts - Firebase Admin SDK for server-side verification
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
        console.log('[Firebase Admin] Initialized successfully');
    } catch (error: any) {
        console.error('[Firebase Admin] Initialization error:', error.message);
        // Continue without Firebase Admin if not configured (development)
    }
}

export default admin;
export const auth = admin.auth();
