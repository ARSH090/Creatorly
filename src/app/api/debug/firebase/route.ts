import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET() {
    const envVars = {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
    };

    let privateKeyStatus = 'Valid';
    if (process.env.FIREBASE_PRIVATE_KEY) {
        if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
            privateKeyStatus = 'Invalid (Missing Header)';
        } else if (process.env.FIREBASE_PRIVATE_KEY.length < 100) {
            privateKeyStatus = 'Invalid (Too Short)';
        }
    } else {
        privateKeyStatus = 'Missing';
    }

    const verification = {
        adminAuthIndexed: !!adminAuth,
        adminDbIndexed: !!adminDb,
        envVars,
        privateKeyStatus,
        timestamp: new Date().toISOString()
    };

    return NextResponse.json(verification, { status: 200 });
}
