import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import User from '@/lib/models/User';

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

        // 1. Parse and Validate signed_request
        const [encodedSig, payload] = signedRequest.split('.');
        if (!encodedSig || !payload) {
            return NextResponse.json({ error: 'Malformed signed_request' }, { status: 400 });
        }

        const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

        // Verify Signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.META_APP_SECRET!)
            .update(payload)
            .digest();

        if (!crypto.timingSafeEqual(sig, expectedSig)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const facebookId = data.user_id;
        if (!facebookId) {
            return NextResponse.json({ error: 'User ID missing in payload' }, { status: 400 });
        }

        await connectToDatabase();

        // 2. Execute Deletion Logic
        // Find social account associated with this Facebook ID
        const account = await SocialAccount.findOne({ pageId: facebookId });

        if (account) {
            const userId = account.userId;

            // Delete Social Accounts
            await SocialAccount.deleteMany({ userId });

            // Log for audit (but remove PII)
            console.log(`[Compliance] Meta data deletion executed for user UID: ${userId}`);

            // In a full implementation, you might soft-delete the User or delete specific Meta logs
            // Here we ensure the tokens and link are severed immediately.
        }

        // 3. Respond with confirmation URL and code
        const confirmationCode = `DEL_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/privacy/deletion-status?code=${confirmationCode}`;

        return NextResponse.json({
            url: statusUrl,
            confirmation_code: confirmationCode
        });
    } catch (error: any) {
        console.error('Data Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

