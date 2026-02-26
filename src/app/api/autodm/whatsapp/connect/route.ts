import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { encryptTokenGCM } from '@/lib/security/encryption';

export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        const { phoneNumberId, accessToken, businessAccountId, displayName } = await req.json();

        if (!phoneNumberId || !accessToken || !businessAccountId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const phoneEnc = encryptTokenGCM(phoneNumberId);
        const tokenEnc = encryptTokenGCM(accessToken);

        await User.findByIdAndUpdate(user._id, {
            $set: {
                whatsappConfig: {
                    phoneNumberId: phoneEnc.encryptedData,
                    phoneNumberIdIV: phoneEnc.iv,
                    phoneNumberIdTag: phoneEnc.tag,
                    accessToken: tokenEnc.encryptedData,
                    accessTokenIV: tokenEnc.iv,
                    accessTokenTag: tokenEnc.tag,
                    businessAccountId,
                    displayName,
                    status: 'connected',
                    connectedAt: new Date()
                }
            }
        });

        return NextResponse.json({ success: true, message: 'WhatsApp connected successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
    try {
        await connectToDatabase();
        await User.findByIdAndUpdate(user._id, {
            $unset: { whatsappConfig: "" }
        });
        return NextResponse.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
