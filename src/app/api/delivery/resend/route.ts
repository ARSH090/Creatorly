import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { DownloadToken } from '@/lib/models/DownloadToken';
import { sendEmail } from '@/lib/services/email';
import crypto from 'crypto';

/**
 * POST /api/delivery/resend
 * Resends the download link to the buyer for a given order.
 * Buyer provides their email + orderNumber — if valid, we generate a new download token.
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { orderNumber, email } = await req.json();

        if (!orderNumber || !email) {
            return NextResponse.json(
                { success: false, error: 'Order number and email are required' },
                { status: 400 }
            );
        }

        // Find the order
        const order = await Order.findOne({
            orderNumber: orderNumber.trim().toUpperCase(),
            customerEmail: email.trim().toLowerCase(),
            paymentStatus: 'paid',
        });

        if (!order) {
            // Don't leak whether order exists — generic message
            return NextResponse.json(
                { success: true, message: 'If this order exists, we will resend the download link.' },
                { status: 200 }
            );
        }

        // Generate a new download token
        const tokenValue = crypto.randomUUID();
        const newToken = await DownloadToken.create({
            token: tokenValue,
            orderId: order._id,
            productId: order.items[0]?.productId,
            buyerEmail: email.trim().toLowerCase(),
            maxDownloads: 3,
            downloadCount: 0,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
            isActive: true,
        });

        const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in'}/api/download/${tokenValue}`;

        // Send email
        await sendEmail({
            to: email.trim().toLowerCase(),
            subject: `Your download link — Order ${order.orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; margin-bottom: 20px;">Download Link Resent</h1>
                    <p>Here's your download link for order <strong>${order.orderNumber}</strong>:</p>
                    <a href="${downloadUrl}" 
                       style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                        Download Your File
                    </a>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        This link expires in 72 hours and allows up to 3 downloads.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 11px;">
                        © 2026 Creatorly. All rights reserved.<br />
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999;">Unsubscribe</a>
                    </p>
                </div>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'Download link has been resent to your email.',
        });

    } catch (error: any) {
        console.error('[DELIVERY RESEND ERROR]:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to resend download link' },
            { status: 500 }
        );
    }
}
