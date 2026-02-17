import { User } from '../models/User';
import { SuspiciousAccount } from '../models/SuspiciousAccount';
import { IPSignup } from '../models/IPSignup';
import { hashPhoneNumber, isBlockedEmailDomain, checkIPQuality } from '../utils/tier-utils';
import { IP_SIGNUP_LIMITS } from '../constants/tier-limits';

export interface AbuseCheckResult {
    passed: boolean;
    reason?: string;
    actionRequired?: 'phone_verification' | 'kyc_required' | 'block' | 'flag';
    matchingUserId?: string;
}

/**
 * LAYER 1: Device Fingerprint Check
 * Detect multiple accounts from same device 
 */
export async function checkDeviceFingerprint(
    fingerprint: string,
    excludeUserId?: string
): Promise<AbuseCheckResult> {
    try {
        const existingUsers = await User.find({
            deviceFingerprint: fingerprint,
            _id: { $ne: excludeUserId },
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        }).select('_id subscriptionStatus email isFlagged');

        if (existingUsers.length === 0) {
            return { passed: true };
        }

        // Check if any previous account was banned
        const bannedAccount = existingUsers.find(u => u.subscriptionStatus === 'banned' || u.isFlagged);
        if (bannedAccount) {
            return {
                passed: false,
                reason: 'Device associated with banned account',
                actionRequired: 'block',
                matchingUserId: bannedAccount._id.toString()
            };
        }

        // Check if previous account had paid subscription that was cancelled
        const cancelledPaidAccount = existingUsers.find(
            u => u.subscriptionStatus === 'cancelled' || u.subscriptionStatus === 'expired'
        );
        if (cancelledPaidAccount) {
            return {
                passed: false,
                reason: 'Device associated with cancelled subscription',
                actionRequired: 'phone_verification',
                matchingUserId: cancelledPaidAccount._id.toString()
            };
        }

        // Multiple free accounts from same device - flag
        if (existingUsers.length >= 2) {
            return {
                passed: false,
                reason: `Multiple accounts detected from this device`,
                actionRequired: 'flag',
                matchingUserId: existingUsers[0]._id.toString()
            };
        }

        return { passed: true };

    } catch (error) {
        console.error('Device fingerprint check failed:', error);
        return { passed: true }; // Fail open in case of errors
    }
}

/**
 * LAYER 2: Phone Number Check
 * One phone per account enforcement
 */
export async function checkPhoneNumber(
    phone: string,
    excludeUserId?: string
): Promise<AbuseCheckResult> {
    try {
        const phoneHash = hashPhoneNumber(phone);

        const existingUser = await User.findOne({
            phoneHash,
            _id: { $ne: excludeUserId }
        }).select('_id email');

        if (existingUser) {
            return {
                passed: false,
                reason: 'This phone number is already registered. Log in instead.',
                actionRequired: 'block',
                matchingUserId: existingUser._id.toString()
            };
        }

        return { passed: true };

    } catch (error) {
        console.error('Phone check failed:', error);
        return { passed: true };
    }
}

/**
 * LAYER 3: IP Address Check
 * Max 3 accounts per IP per 30 days
 */
export async function checkIPAddress(
    ipAddress: string,
    excludeUserId?: string
): Promise<AbuseCheckResult> {
    try {
        const thirtyDaysAgo = new Date(Date.now() - IP_SIGNUP_LIMITS.WINDOW_DAYS * 24 * 60 * 60 * 1000);

        const signupsFromIP = await IPSignup.countDocuments({
            ipAddress,
            createdAt: { $gte: thirtyDaysAgo }
        });

        if (signupsFromIP >= IP_SIGNUP_LIMITS.MAX_ACCOUNTS_PER_IP) {
            return {
                passed: false,
                reason: `Too many accounts created from this network. Maximum ${IP_SIGNUP_LIMITS.MAX_ACCOUNTS_PER_IP} per ${IP_SIGNUP_LIMITS.WINDOW_DAYS} days.`,
                actionRequired: 'kyc_required'
            };
        }

        // Check IP quality (VPN/Proxy)
        const ipQuality = await checkIPQuality(ipAddress);
        if (ipQuality.isProxy || ipQuality.isVPN) {
            return {
                passed: false,
                reason: 'VPN/Proxy detected. Please use your real IP address or complete additional verification.',
                actionRequired: 'phone_verification'
            };
        }

        return { passed: true };

    } catch (error) {
        console.error('IP check failed:', error);
        return { passed: true };
    }
}

/**
 * LAYER 4: Email Domain Check
 * Block disposable email providers
 */
export async function checkEmailDomain(email: string): Promise<AbuseCheckResult> {
    if (isBlockedEmailDomain(email)) {
        const domain = email.split('@')[1];
        return {
            passed: false,
            reason: `Email domain "${domain}" is not allowed. Please use a permanent email address.`,
            actionRequired: 'block'
        };
    }

    return { passed: true };
}

/**
 * LAYER 5: Behavioral Analysis
 * Check for quick succession account creation after hitting limits
 */
export async function checkBehavioralPatterns(
    email: string,
    deviceFingerprint?: string
): Promise<AbuseCheckResult> {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Find users who hit free tier limits recently
        if (deviceFingerprint) {
            const recentLimitedUsers = await User.find({
                deviceFingerprint,
                $or: [
                    { freeTierOrdersCount: { $gte: 50 } },
                    { freeTierLeadsCount: { $gte: 100 } }
                ],
                createdAt: { $gte: sevenDaysAgo }
            });

            if (recentLimitedUsers.length > 0) {
                return {
                    passed: false,
                    reason: 'Suspicious pattern detected: Account creation after limit reached',
                    actionRequired: 'flag',
                    matchingUserId: recentLimitedUsers[0]._id.toString()
                };
            }
        }

        return { passed: true };

    } catch (error) {
        console.error('Behavioral check failed:', error);
        return { passed: true };
    }
}

/**
 * Comprehensive Multi-Layer Abuse Check
 * Run all checks before allowing signup
 */
export async function runAbuseChecks(params: {
    email: string;
    phone: string;
    ipAddress: string;
    deviceFingerprint?: string;
    excludeUserId?: string;
}): Promise<AbuseCheckResult[]> {
    const { email, phone, ipAddress, deviceFingerprint, excludeUserId } = params;

    const checks: AbuseCheckResult[] = [];

    // Layer 1: Device Fingerprint
    if (deviceFingerprint) {
        checks.push(await checkDeviceFingerprint(deviceFingerprint, excludeUserId));
    }

    // Layer 2: Phone Number
    checks.push(await checkPhoneNumber(phone, excludeUserId));

    // Layer 3: IP Address
    checks.push(await checkIPAddress(ipAddress, excludeUserId));

    // Layer 4: Email Domain
    checks.push(await checkEmailDomain(email));

    // Layer 5: Behavioral
    if (deviceFingerprint) {
        checks.push(await checkBehavioralPatterns(email, deviceFingerprint));
    }

    return checks;
}

/**
 * Log suspicious account and take action
 */
export async function flagSuspiciousAccount(
    userId: string,
    matchType: 'phone' | 'device' | 'ip' | 'payment' | 'email_domain',
    reason: string,
    actionTaken: 'flagged' | 'warned' | 'banned' | 'kyc_required',
    matchingUserId?: string,
    metadata?: any
) {
    try {
        await SuspiciousAccount.create({
            userId,
            reason,
            matchingUserId,
            matchType,
            actionTaken,
            metadata
        });

        // Update user record
        if (actionTaken === 'banned') {
            await User.findByIdAndUpdate(userId, {
                subscriptionStatus: 'banned',
                isFlagged: true,
                flagReason: reason,
                flaggedAt: new Date()
            });
        } else if (actionTaken === 'flagged' || actionTaken === 'kyc_required') {
            await User.findByIdAndUpdate(userId, {
                isFlagged: true,
                flagReason: reason,
                flaggedAt: new Date(),
                kycStatus: actionTaken === 'kyc_required' ? 'pending' : 'none'
            });
        }

        console.log(`Flagged suspicious account: ${userId} - ${reason}`);

    } catch (error) {
        console.error('Failed to flag suspicious account:', error);
    }
}

/**
 * Track IP signup
 */
export async function trackIPSignup(
    userId: string,
    ipAddress: string
) {
    try {
        const ipQuality = await checkIPQuality(ipAddress);

        await IPSignup.create({
            userId,
            ipAddress,
            country: ipQuality.country,
            isProxy: ipQuality.isProxy,
            isVPN: ipQuality.isVPN
        });

    } catch (error) {
        console.error('Failed to track IP signup:', error);
    }
}
