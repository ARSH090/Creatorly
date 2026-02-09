import { Device } from '@/lib/models/Device';
import { AbuseLog } from '@/lib/models/AbuseLog';
import { connectToDatabase } from '@/lib/db/mongodb';

interface AbuseCheckResult {
    blocked: boolean;
    reason?: string;
    action?: 'BLOCK' | 'FLAG' | 'CHALLENGE' | 'ALLOW';
}

export async function checkDeviceAbuse(
    fingerprintHash: string,
    ip: string,
    userAgent: string,
    plan: string = 'free'
): Promise<AbuseCheckResult> {
    await connectToDatabase();

    // 1. Check if device has exhausted free account limits
    // Only enforce this check if the user is trying to sign up for a FREE plan
    if (plan === 'free') {
        const existingDevice = await Device.findOne({ fingerprintHash });

        if (existingDevice && existingDevice.freeAccountUsed) {
            // Log the attempted abuse
            await AbuseLog.create({
                fingerprintHash,
                ip,
                type: 'MULTI_ACCOUNT',
                severity: 'HIGH',
                action: 'BLOCK',
                metadata: { userAgent, deviceId: existingDevice._id }
            });

            return {
                blocked: true,
                reason: 'This device has already created a free account.',
                action: 'BLOCK'
            };
        }
    }

    // 2. [Optional] Check IP reputation or rate limits here if needed
    // For now, we rely on the middleware Redis rate limiter.

    return { blocked: false, action: 'ALLOW' };
}

export async function registerDevice(
    fingerprintHash: string,
    userId: string,
    ip: string,
    userAgent: string,
    plan: string = 'free',
    metadata: any = {}
) {
    await connectToDatabase();

    // Only mark as used for free account if the plan is free
    const isFree = plan === 'free';

    // Create or update device record
    return await Device.findOneAndUpdate(
        { fingerprintHash },
        {
            $set: {
                userId, // Link to the user
                lastSeenAt: new Date(),
                metadata: {
                    ...metadata,
                    ip,
                    userAgent
                }
            },
            // Only set these if it's a free plan and not already set
            ...(isFree ? {
                $setOnInsert: {
                    freeAccountUsed: true,
                    freeAccountUserId: userId
                }
            } : {})
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}
