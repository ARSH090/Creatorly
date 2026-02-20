import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CommunityPost from '@/lib/models/CommunityPost';
import Comment from '@/lib/models/Comment';
import { withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (req, user, context: any) => {
    try {
        await connectToDatabase();
        const { postId } = await context.params;

        const comments = await Comment.find({ postId })
            .sort({ createdAt: 1 })
            .populate('userId', 'displayName username avatar');

        return NextResponse.json({
            comments: comments.map((c: any) => ({
                id: c._id,
                content: c.content,
                author: c.userId?.username || c.userId?.displayName || 'Unknown',
                authorAvatar: c.userId?.avatar,
                createdAt: c.createdAt
            }))
        });

    } catch (error: any) {
        console.error('Get Comments Error:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
});

export const POST = withAuth(async (req, user, context: any) => {
    try {
        await connectToDatabase();
        const userId = user._id;
        const { postId } = await context.params;
        const body = await req.json();
        const { content } = body;

        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const comment = await Comment.create({
            postId,
            userId,
            content
        });

        // Update post comment count
        await CommunityPost.findByIdAndUpdate(postId, {
            $inc: { comments: 1 }
        });

        const populatedComment = await comment.populate('userId', 'displayName username avatar');

        return NextResponse.json({
            success: true,
            comment: {
                id: populatedComment._id,
                content: populatedComment.content,
                author: (populatedComment.userId as any)?.username || 'Unknown',
                authorAvatar: (populatedComment.userId as any)?.avatar,
                createdAt: populatedComment.createdAt
            }
        });

    } catch (error: any) {
        console.error('Post Comment Error:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
});
