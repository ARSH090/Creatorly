import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { recordAdminAction } from '@/lib/utils/auditLogger';
import { razorpay } from '@/lib/payments/razorpay';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import DownloadToken from '@/lib/models/DownloadToken';
import LicenseKey from '@/lib/models/LicenseKey';
import { mailQueue } from '@/lib/queue';
import { Order as Enrollment } from '@/lib/models/Order'; // Alias used in user prompt, but logic uses CourseProgress dynamic import below

async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return new NextResponse('Order not found', { status: 404 });

    if (!['completed', 'success'].includes(order.status)) {
        return new NextResponse('Order is not eligible for refund', { status: 400 });
    }

    const paymentId = order.razorpayPaymentId;
    if (!paymentId) {
        return new NextResponse('Payment ID missing', { status: 400 });
    }

    // Process Refund with Razorpay
    try {
        await razorpay.payments.refund(paymentId, {
            notes: {
                reason: 'Admin initiated refund',
                admin: user.email
            }
        });
    } catch (rpError: any) {
        console.error('Razorpay Refund Error:', rpError);
        return new NextResponse(`Razorpay Error: ${rpError.error?.description || rpError.message}`, { status: 502 });
    }

    // Update Order Status
    order.status = 'refunded';
    order.refundedAt = new Date();
    await order.save();

    // Revoke all access granted by this order
    try {
        await DownloadToken.updateMany(
            { orderId: order._id },
            { $set: { isActive: false, revokedAt: new Date(), revokedReason: 'refund' } }
        );
        await LicenseKey.updateMany(
            { orderId: order._id },
            { $set: { isRevoked: true, revokedAt: new Date() } }
        );
        // Revoke course enrollment if applicable
        const CourseProgress = (await import('@/lib/models/CourseProgress')).default;
        await CourseProgress.updateMany(
            { orderId: order._id },
            { $set: { accessRevoked: true, revokedAt: new Date() } }
        );
        // Queue access revocation email to buyer
        await mailQueue.add('access-revoked', {
            to: order.customerEmail,
            subject: 'Your access has been revoked — Refund processed',
            html: `<p>Hi,</p><p>Your refund for order <strong>${order.orderNumber}</strong> has been processed.</p><p>Access to associated products, courses, and downloads has been revoked.</p><p>If you have any questions, please contact support.</p>`,
        });
        console.log(`[Refund] Access revoked for order ${order._id}, email ${order.customerEmail}`);
    } catch (revokeErr: any) {
        console.error('[Refund] Failed to revoke access:', revokeErr.message);
        // Do not fail the refund if access revocation fails — log for manual follow-up
    }

    // Log the refund action using consolidated utility
    await recordAdminAction({
        adminEmail: user.email,
        action: 'refund_order',
        targetType: 'order',
        targetId: order._id.toString(),
        changes: {
            paymentId,
            amount: order.total,
            status: 'refunded'
        },
        req
    });

    return NextResponse.json({ message: 'Order refunded successfully' });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
