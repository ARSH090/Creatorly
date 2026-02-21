import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import Referral from '@/lib/models/Referral';
import { leadSchema } from '@/lib/validation/leadSchema';
import { buildWhatsAppMessage, generateWhatsAppDeepLink, enqueueWhatsAppAutoSend } from '@/lib/services/whatsapp';
import { appendLeadToSheet } from '@/lib/services/googleSheets';
import { checkRateLimit } from '@/middleware/rateLimit';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        // 0. Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success, remaining, reset } = await checkRateLimit(request, ip, {
            limit: 5, // 5 leads per window
            window: 60 // 1 minute window
        });

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '5',
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString()
                    }
                }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate with Zod
        const validatedData = leadSchema.parse(body);

        // Connect to MongoDB
        await connectToDatabase();

        // Check for referral cookie
        const referralCode = request.cookies.get('referral_code')?.value || request.cookies.get('affiliate_ref')?.value;
        let referredBy: string | undefined;

        if (referralCode) {
            const referral = await Referral.findOne({ code: referralCode });
            if (referral) {
                referredBy = referral.userId;
            }
        }

        // Create lead document
        const lead = await Lead.create({
            ...validatedData,
            referredBy,
        });

        // Increment conversion count for referrer (fire-and-forget)
        if (referredBy) {
            Referral.findOneAndUpdate(
                { userId: referredBy },
                { $inc: { conversions: 1 } }
            ).catch(err => console.error('Failed to increment conversion', err));
        }

        // Fire-and-forget Google Sheets update
        appendLeadToSheet({
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            interest: lead.interest,
            createdAt: lead.createdAt || new Date(),
        }).catch(err => console.error('Sheet append failed (already logged):', err));

        // Build dynamic message
        const message = buildWhatsAppMessage(
            validatedData.name,
            validatedData.interest
        );

        // Generate deep link (for manual send)
        const deepLink = generateWhatsAppDeepLink(
            validatedData.phone,
            message
        );

        // If auto‑send is enabled (via env), enqueue job
        const autoSendEnabled = process.env.WHATSAPP_AUTO_SEND === 'true';
        if (autoSendEnabled) {
            // lead._id is an ObjectId in Mongoose, it has a toString() method.
            const leadId = String(lead._id);
            await enqueueWhatsAppAutoSend({
                leadId,
                name: validatedData.name,
                phone: validatedData.phone,
                interest: validatedData.interest,
                message,
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Lead saved successfully',
                data: {
                    lead,
                    deepLink,
                    autoSend: autoSendEnabled ? 'queued' : 'disabled',
                }
            },
            { status: 201 }
        );
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, message: 'Validation error', errors: error.issues },
                { status: 400 }
            );
        }

        // Handle other errors
        console.error('Lead save error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
