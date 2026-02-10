import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import CreatorProfile from '@/lib/models/CreatorProfile';
import CommunityPost from '@/lib/models/CommunityPost';
import { withAuth } from '@/lib/firebase/withAuth';

export const dynamic = 'force-dynamic';

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}

export const GET = withAuth(async (req, user, context: any) => {
    try {
        await connectToDatabase();
        const userId = user._id;

        // 1. Fetch Creator Profile
        const { username } = await context.params;
        const creatorProfile = await CreatorProfile.findOne({ username });
        if (!creatorProfile) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        // 2. Check Access
        // User must have at least one successful order/subscription with this creator
        const hasAccess = await Order.findOne({
            userId,
            creatorId: creatorProfile.creatorId,
            status: 'success'
        });

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // 3. Fetch Real Feed Posts
        const posts = await CommunityPost.find({ creatorId: user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({
            posts: posts.map(post => ({
                id: post._id.toString(),
                author: username,
                content: post.content,
                likes: post.likes || 0,
                comments: post.comments || 0,
                timestamp: formatTimeAgo(post.createdAt),
                image: post.image
            }))
        });

    } catch (error: any) {
        console.error('Community API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
    }
});
