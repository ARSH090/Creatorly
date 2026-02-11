import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Automation } from '@/lib/models/Automation';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';

export async function POST(req: NextRequest) {
    try {
        const { creatorId, triggerType, recipient, metadata } = await req.json();

        if (!creatorId || !triggerType || !recipient) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Find active automation for this creator and trigger
        const automation = await Automation.findOne({
            creatorId,
            triggerType,
            isActive: true
        });

        if (!automation) {
            return NextResponse.json({ message: 'No active automation found for this trigger' });
        }

        // 2. Rate Limiting check (per recipient per automation)
        const rateLimitKey = `automation:${automation._id}:${recipient}`;
        const isAllowed = await RedisRateLimiter.check(rateLimitKey, 1, automation.rateLimitMs, 'global');

        if (!isAllowed) {
            automation.logs.push({
                recipient,
                status: 'rate_limited',
                timestamp: new Date()
            });
            await automation.save();
            return NextResponse.json({ error: 'Rate limit exceeded for this recipient' }, { status: 429 });
        }

        // 3. Simulate Message Sending (Meta/WhatsApp API would go here)
        console.log(`[Automation] Sending ${automation.platform} message to ${recipient}: ${automation.messageTemplate}`);

        // Success Simulation
        automation.logs.push({
            recipient,
            status: 'success',
            timestamp: new Date()
        });

        await automation.save();

        return NextResponse.json({
            success: true,
            message: `${automation.platform} message triggered successfully`
        });

    } catch (error: any) {
        console.error('[Automation Trigger] Final Failure:', error);

        // Log to internal incident response if possible
        try {
            const { Automation } = await import('@/lib/models/Automation');
            // We might not have the automation object here if it failed early, but we can try
            // or just log to a global system log
        } catch (e) { }

        return NextResponse.json({
            error: 'Failed to process automation',
            message: error.message
        }, { status: 500 });
    }
}

