import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import LeadMagnet from '@/lib/models/LeadMagnet';
import { isDisposableEmail, isValidEmail } from '@/lib/utils/emailValidation';
import { log } from '@/utils/logger';
import { getS3PresignedUrl } from '@/lib/utils/s3';
import { sendEmail } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/leads
 * Captures a lead email for a specific lead magnet
 */
export async function POST(req: NextRequest) {
    try {
        await connectTo Database();

        const body = await req.json();
        const { email, lead_magnet_id, source } = body;

        // Validation
        if (!email || !lead_magnet_id) {
            return NextResponse.json(
                { error: 'Missing required fields: email, lead_magnet_id' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 422 }
            );
        }

        if (isDisposableEmail(email)) {
            return NextResponse.json(
                { error: 'Disposable email addresses are not allowed', code: 'DISPOSABLE_EMAIL' },
                { status: 400 }
            );
        }

        // Verify lead magnet exists and is active
        const leadMagnet = await LeadMagnet.findById(lead_magnet_id);
        if (!leadMagnet || !leadMagnet.isActive) {
            return NextResponse.json(
                { error: 'Lead magnet not found or inactive' },
                { status: 404 }
            );
        }

        // Create lead (duplicate will be silently handled by unique index)
        let lead;
        let isNew = false;

        try {
            lead = await Lead.create({
                email: email.toLowerCase().trim(),
                leadMagnetId: lead_magnet_id,
                creatorId: leadMagnet.creatorId,
                source: source || '',
            });
            isNew = true;
        } catch (err: any) {
            if (err.code === 11000) {
                // Duplicate key - email already captured for this lead magnet
                // This is OK, we'll just return success without sending email again
                lead = await Lead.findOne({ email: email.toLowerCase().trim(), leadMagnetId: lead_magnet_id });
                log.info(`Duplicate lead capture attempt: ${email} for lead magnet ${lead_magnet_id}`);
            } else {
                throw err;
            }
        }

        // Send free download email (only for new leads)
        if (isNew && lead) {
            try {
                // Generate presigned URL for download (valid for 24 hours)
                const downloadUrl = await getS3PresignedUrl(leadMagnet.fileKey, 86400);

                await sendEmail({
                    to: email,
                    subject: `Your free download: ${leadMagnet.title}`,
                    html: `
            <h2>Thanks for your interest!</h2>
            <p>You can download <strong>${leadMagnet.title}</strong> using the link below:</p>
            <p><a href="${downloadUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Now</a></p>
            <p>This link is valid for 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          `,
                });

                // Mark download as sent
                await Lead.findByIdAndUpdate(lead._id, {
                    downloadSent: true,
                    downloadSentAt: new Date(),
                });

                // Increment download count on lead magnet
                await LeadMagnet.findByIdAndUpdate(leadMagnet._id, {
                    $inc: { downloadCount: 1 },
                });

                log.info(`Free download sent to ${email} for lead magnet ${leadMagnet.title}`);
            } catch (emailErr: any) {
                log.error('Failed to send lead magnet email', { error: emailErr.message, email, leadMagnetId: lead_magnet_id });
                // Don't fail the request even if email fails - lead is captured
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: isNew ? 'Lead captured successfully. Check your email for the download link.' : 'Download link already sent to this email.',
                isNew
            },
            { status: isNew ? 201 : 200 }
        );

    } catch (error: any) {
        log.error('Lead capture error', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to capture lead', code: 'LEAD_CAPTURE_FAILED' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/leads
 * Returns leads for the authenticated creator (paginated)
 */
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // Max 100 per page
        const leadMagnetId = searchParams.get('lead_magnet_id');

        // Get creatorId from auth (assuming you have auth middleware)
        // For now, placeholder - you'll need to extract from Clerk session
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: Extract creatorId from Clerk JWT
        // const creatorId = await getCreatorIdFromAuth(authHeader);
        // For now, return error if not implemented
        return NextResponse.json(
            { error: 'Auth integration pending - implement Clerk JWT extraction' },
            { status: 501 }
        );

        // const query: any = { creatorId };
        // if (leadMagnetId) {
        //   query.leadMagnetId = leadMagnetId;
        // }

        // const skip = (page - 1) * limit;

        // const [leads, total] = await Promise.all([
        //   Lead.find(query)
        //     .populate('leadMagnetId', 'title')
        //     .sort({ createdAt: -1 })
        //     .skip(skip)
        //     .limit(limit)
        //     .lean(),
        //   Lead.countDocuments(query),
        // ]);

        // const pages = Math.ceil(total / limit);

        // return NextResponse.json({
        //   leads,
        //   pagination: {
        //     page,
        //     limit,
        //     total,
        //     pages,
        //   },
        // });

    } catch (error: any) {
        log.error('Get leads error', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}
