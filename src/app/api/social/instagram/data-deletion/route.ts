import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';

/**
 * Meta Data Deletion Callback
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.formData();
        const signedRequest = body.get('signed_request') as string;

        if (!signedRequest) {
            return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
        }

        // Logic to decode signed_request and find the user would go here
        // Meta sends a signed request that needs to be parsed with the App Secret

        // For compliance, we respond with a URL where users can check status
        const confirmationCode = Math.random().toString(36).substring(7);
        const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/privacy/deletion-status?code=${confirmationCode}`;

        return NextResponse.json({
            url: statusUrl,
            confirmation_code: confirmationCode
        });
    } catch (error) {
        console.error('Data Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
