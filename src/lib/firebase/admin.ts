import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const apps = getApps();

// Check for required environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (apps.length === 0 && projectId && clientEmail && privateKey) {
    try {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n')
            })
        });
    } catch (e) {
        console.warn('Firebase Admin initialization failed:', e);
    }
} else if (apps.length === 0) {
    console.warn('Skipping Firebase Admin initialization: Missing environment variables');
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    console.warn('Missing keys:', missing.join(', '));
}

let auth;
let db;

try {
    if (getApps().length > 0) {
        auth = getAuth();
        db = getFirestore();
    }
} catch (e) {
    console.warn('Failed to get Firebase services:', e);
}

export const adminAuth = auth;
export const adminDb = db;

export default function initAdmin() {
    // Already initialized above
    return true;
}
