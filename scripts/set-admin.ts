#!/usr/bin/env ts-node

/**
 * Script to create or set admin custom claim for a user in Firebase
 * 
 * Usage: 
 *   ts-node scripts/set-admin.ts your-email@example.com
 * 
 * This grants admin privileges to the specified email address by setting
 * a custom claim in Firebase Auth.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

async function setAdminClaim(email: string) {
    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        // Set custom claim
        await admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        });

        console.log(`✅ Successfully granted admin access to: ${email}`);
        console.log(`   User UID: ${user.uid}`);
        console.log(`\nThe user must sign out and sign back in for the changes to take effect.`);

        process.exit(0);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌ Error: No user found with email: ${email}`);
            console.log(`\nPlease create a user account first, then run this script.`);
        } else {
            console.error(`❌ Error setting admin claim:`, error.message);
        }
        process.exit(1);
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.log('\nUsage: ts-node scripts/set-admin.ts your-email@example.com');
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
}

console.log(`Setting admin claim for: ${email}...\n`);
setAdminClaim(email);
