import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CommunityPost from '@/lib/models/CommunityPost';
import { withAuth } from '@/lib/auth/withAuth';

export const POST = withAuth(async (req, user, context: any) => {
    try {
        await connectToDatabase();
        const userId = user._id;
        const { postId } = await context.params;

        const post = await CommunityPost.findById(postId);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const isLiked = post.likedBy.includes(userId);

        if (isLiked) {
            // Unlike
            await CommunityPost.findByIdAndUpdate(postId, {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            });
        } else {
            // Like
            await CommunityPost.findByIdAndUpdate(postId, {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            });
        }

        return NextResponse.json({ success: true, liked: !isLiked });

    } catch (error: any) {
        console.error('Like API Error:', error);
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }
});
