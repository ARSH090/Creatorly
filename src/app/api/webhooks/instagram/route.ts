import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { decryptStringToken } from '@/lib/security/encryption';
import {
    processCommentTrigger,
    processDMTrigger,
    processNewFollowerTrigger,
    processStoryReplyTrigger
} from '@/lib/services/autoDMService';

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

// POST — Receives ALL events for ALL creators
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text(); // MUST read as text first

        // Verify request is from Meta
        const signature = req.headers.get('x-hub-signature-256');
        const appSecret = process.env.INSTAGRAM_APP_SECRET;

        if (!appSecret) {
            console.error('Missing INSTAGRAM_APP_SECRET');
            return new NextResponse('OK', { status: 200 });
        }

        if (!signature) {
            console.warn('Missing signature');
            return new NextResponse('OK', { status: 200 }); // Always 200 to Meta
        }

        const expectedSig = 'sha256=' + crypto
            .createHmac('sha256', appSecret)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSig) {
            console.error('Invalid webhook signature');
            return new NextResponse('Invalid signature', { status: 401 }); // The prompt allows 401 here if invalid sig
        }

        const body = JSON.parse(rawBody);

        await dbConnect();

        // Process each entry — each entry = one creator's account
        for (const entry of body.entry || []) {
            const creatorIgId = entry.id; // Instagram User ID of the creator

            // Find which Creatorly creator owns this Instagram account
            const creator = await User.findOne({
                'instagramConnection.instagramUserId': creatorIgId,
                'instagramConnection.isConnected': true
            }).select('_id instagramConnection plan');

            if (!creator) continue; // Not a Creatorly creator — skip

            // Check platform feature flag (simplified check here, can be extended)
            // const config = await getPlatformConfig();
            // if (!config?.features?.autoDMEnabled) continue;

            const accessToken = decryptStringToken(creator.instagramConnection?.accessToken!);

            // Process each change in this entry
            for (const change of entry.changes || []) {
                // Comment trigger
                if (change.field === 'comments') {
                    await processCommentTrigger({
                        creatorId: creator._id.toString(),
                        creatorIgId,
                        accessToken,
                        postId: change.value.media?.id,
                        commentId: change.value.id,
                        commentText: change.value.text || '',
                        commenterIgId: change.value.from?.id,
                        commenterUsername: change.value.from?.username || 'user',
                    }).catch(e => console.error('Error in processCommentTrigger:', e));
                }

                // Direct message trigger
                if (change.field === 'messages') {
                    await processDMTrigger({
                        creatorId: creator._id.toString(),
                        accessToken,
                        senderId: change.value.sender?.id,
                        senderUsername: change.value.sender?.username || 'user',
                        messageText: change.value.message?.text || '',
                    }).catch(e => console.error('Error in processDMTrigger:', e));
                }

                // New follower trigger
                if (change.field === 'follows') {
                    await processNewFollowerTrigger({
                        creatorId: creator._id.toString(),
                        accessToken,
                        followerIgId: change.value.id,
                        followerUsername: change.value.username || 'user',
                    }).catch(e => console.error('Error in processNewFollowerTrigger:', e));
                }

                // Story reply trigger
                if (change.field === 'mentions') {
                    await processStoryReplyTrigger({
                        creatorId: creator._id.toString(),
                        accessToken,
                        replierId: change.value.from?.id,
                        replierUsername: change.value.from?.username || 'user',
                        replyText: change.value.text || '',
                        storyId: change.value.media_id,
                    }).catch(e => console.error('Error in processStoryReplyTrigger:', e));
                }
            }
        }

        // ALWAYS return 200 — even on errors
        return new NextResponse('OK', { status: 200 });

    } catch (error: any) {
        console.error('Webhook POST Error:', error);
        return new NextResponse('OK', { status: 200 });
    }
}

