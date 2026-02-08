import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { AdminLog } from '@/lib/models/AdminLog';
import { adminAuthMiddleware, checkAdminPermission } from '@/lib/middleware/adminAuth';
import { z } from 'zod';
import Razorpay from 'razorpay';

const payoutProcessSchema = z.object({
  payoutIds: z.array(z.string()),
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(req: NextRequest) {
  try {
    const auth = await adminAuthMiddleware(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!checkAdminPermission('manage_payouts', auth.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    await connectToDatabase();

    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      Payout.find({ status })
        .populate('creatorId', 'displayName email bankAccount')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payout.countDocuments({ status }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminAuthMiddleware(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!checkAdminPermission('manage_payouts', auth.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const validation = payoutProcessSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const payouts = await Payout.find({ _id: { $in: validation.data.payoutIds } });

    let processedCount = 0;
    const results = [];

    for (const payout of payouts) {
      try {
        if (validation.data.status === 'approved') {
          // Process through Razorpay
          const transferResponse = await razorpay.transfers.create({
            account: payout.creatorId.toString(),
            amount: payout.amount * 100, // Convert to paise
            currency: 'INR',
          });

          payout.status = 'processed';
          payout.transactionId = transferResponse.id;
          payout.processedAt = new Date();
          payout.processedBy = auth.user._id;
        } else {
          payout.status = 'rejected';
          payout.rejectionReason = validation.data.notes;
        }

        await payout.save();

        await AdminLog.create({
          adminId: auth.user._id,
          adminEmail: auth.user.email,
          action: 'PROCESS_PAYOUT',
          resource: 'PAYOUT',
          resourceId: payout._id,
          description: `${validation.data.status} payout of ₹${payout.amount}`,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          status: 'success',
        });

        results.push({ payoutId: payout._id, status: 'success' });
        processedCount++;
      } catch (error) {
        console.error(`Error processing payout ${payout._id}:`, error);
        results.push({ payoutId: payout._id, status: 'failed', error: (error as any).message });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedCount}/${payouts.length} payouts`,
      results,
    });
  } catch (error) {
    console.error('Process payouts error:', error);
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}
