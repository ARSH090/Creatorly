import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { withAuth } from '@/lib/firebase/withAuth';

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

        // 3. Mock Feed Posts (These would normally come from a CommunityPost model)
        const posts = [
            {
                id: '1',
                author: username,
                content: "Hey everyone! Just uploaded the new presets for this month. Check them out in the digital downloads section if you're on the Pro tier! 🚀",
                likes: 42,
                comments: 12,
                timestamp: '2 hours ago',
                image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000'
            },
            {
                id: '2',
                author: username,
                content: "Working on a new masterclass about storytelling. What's the #1 struggle you face when planning your content?",
                likes: 89,
                comments: 45,
                timestamp: '1 day ago'
            }
        ];

        return NextResponse.json({ posts });

    } catch (error: any) {
        console.error('Community API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
    }
});
