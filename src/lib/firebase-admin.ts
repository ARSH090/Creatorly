// lib/firebase-admin.ts - Firebase Admin SDK for server-side verification
import * as admin from 'firebase-admin';

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
    if (privateKey && clientEmail && projectId) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('[Firebase Admin] Initialized successfully');
        } catch (error: any) {
            console.error('[Firebase Admin] Initialization error:', error.message);
        }
    } else {
        console.warn('[Firebase Admin] Skipping initialization: Missing credentials (expected during build)');
    }
}

export default admin;

// Safely export auth - if not initialized, this will be a dummy that might fail at runtime
// but won't crash the build process
export const auth = admin.apps.length ? admin.auth() : {} as any;
