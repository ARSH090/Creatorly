import admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        console.warn('Firebase Admin credentials not found. Some administrative features will be unavailable.');
    }
}

// Lazy-safe export for adminAuth
// This prevents crashes during build time when no apps are initialized
export const adminAuth = (function () {
    return {
        get verifyIdToken() {
            if (!admin.apps.length) {
                return async () => { throw new Error('Firebase Admin not initialized'); };
            }
            return admin.auth().verifyIdToken.bind(admin.auth());
        },
        // Add other methods as needed, or cast as any for broad compatibility
    } as any;
})();

export default admin;
