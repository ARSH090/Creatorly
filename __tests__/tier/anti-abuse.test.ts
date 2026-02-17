import { runAbuseChecks, checkPhoneNumber, checkDeviceFingerprint, checkIPAddress } from '@/lib/services/abuse-detection';
import { isBlockedEmailDomain, hashPhoneNumber } from '@/lib/utils/tier-utils';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { IPSignup } from '@/lib/models/IPSignup';

describe('Anti-Abuse System', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    describe('Test 2: Multi-account via same phone blocked', () => {
        it('should block signup with duplicate phone number', async () => {
            const phone = '+919876543210';
            const phoneHash = hashPhoneNumber(phone);

            // Create first user
            const user1 = await User.create({
                email: 'user1@example.com',
                username: 'user1',
                clerkId: 'clerk_user1',
                phoneHash,
                phoneVerified: true,
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '192.168.1.1',
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            // Try to create second user with same phone
            const check = await checkPhoneNumber(phone);
            expect(check.passed).toBe(false);
            expect(check.reason).toContain('already registered');
            expect(check.actionRequired).toBe('block');

            // Cleanup
            await User.findByIdAndDelete(user1._id);
        });

        it('should allow signup with unique phone', async () => {
            const phone = '+918765432109';

            const check = await checkPhoneNumber(phone);
            expect(check.passed).toBe(true);
        });
    });

    describe('Test 3: Multi-account via same device flagged', () => {
        it('should flag second account from same device fingerprint', async () => {
            const fingerprint = 'device_fingerprint_abc123';

            // Create first user
            const user1 = await User.create({
                email: 'device1@example.com',
                username: 'device1',
                clerkId: 'clerk_device1',
                deviceFingerprint: fingerprint,
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '192.168.1.2',
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            // Create second user with same fingerprint
            const user2 = await User.create({
                email: 'device2@example.com',
                username: 'device2',
                clerkId: 'clerk_device2',
                deviceFingerprint: fingerprint,
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '192.168.1.3',
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            // Check should flag
            const check = await checkDeviceFingerprint(fingerprint, user2._id.toString());
            expect(check.passed).toBe(false);
            expect(check.actionRequired).toBe('flag');

            // Cleanup
            await User.findByIdAndDelete(user1._id);
            await User.findByIdAndDelete(user2._id);
        });
    });

    describe('Test 4: Disposable email blocked', () => {
        it('should block tempmail.com', () => {
            expect(isBlockedEmailDomain('test@tempmail.com')).toBe(true);
        });

        it('should block mailinator.com', () => {
            expect(isBlockedEmailDomain('test@mailinator.com')).toBe(true);
        });

        it('should allow gmail.com', () => {
            expect(isBlockedEmailDomain('test@gmail.com')).toBe(false);
        });

        it('should allow custom domain', () => {
            expect(isBlockedEmailDomain('test@company.com')).toBe(false);
        });
    });

    describe('Test 5: IP limit (3 max per 30 days)', () => {
        it('should allow 3 signups from same IP', async () => {
            const ip = '203.0.113.45';

            // Create 3 users from same IP
            const user1 = await User.create({
                email: 'ip1@example.com',
                username: 'ip1',
                clerkId: 'clerk_ip1',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: ip,
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            await IPSignup.create({ userId: user1._id, ipAddress: ip });

            const user2 = await User.create({
                email: 'ip2@example.com',
                username: 'ip2',
                clerkId: 'clerk_ip2',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: ip,
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            await IPSignup.create({ userId: user2._id, ipAddress: ip });

            // 3rd signup should still work
            const check3 = await checkIPAddress(ip);
            expect(check3.passed).toBe(true);

            const user3 = await User.create({
                email: 'ip3@example.com',
                username: 'ip3',
                clerkId: 'clerk_ip3',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: ip,
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            await IPSignup.create({ userId: user3._id, ipAddress: ip });

            // 4th signup should fail
            const check4 = await checkIPAddress(ip);
            expect(check4.passed).toBe(false);
            expect(check4.actionRequired).toBe('kyc_required');

            // Cleanup
            await User.deleteMany({ _id: { $in: [user1._id, user2._id, user3._id] } });
            await IPSignup.deleteMany({ ipAddress: ip });
        });
    });

    describe('Test 6: Subscription expiry downgrade', () => {
        it('should downgrade expired subscription to free tier', async () => {
            const user = await User.create({
                email: 'expiry@example.com',
                username: 'expiry',
                clerkId: 'clerk_expiry',
                subscriptionTier: 'creator',
                subscriptionStatus: 'active',
                subscriptionEndAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                signupIp: '192.168.1.100',
                phoneVerified: true,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            const { shouldDowngrade } = await import('@/lib/utils/tier-utils');
            const result = shouldDowngrade(user.subscriptionStatus, user.subscriptionEndAt);
            expect(result).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
        });

        it('should not downgrade active subscription before expiry', async () => {
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

            const user = await User.create({
                email: 'active@example.com',
                username: 'active',
                clerkId: 'clerk_active',
                subscriptionTier: 'creator',
                subscriptionStatus: 'active',
                subscriptionEndAt: futureDate,
                signupIp: '192.168.1.101',
                phoneVerified: true,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            const { shouldDowngrade } = await import('@/lib/utils/tier-utils');
            const result = shouldDowngrade(user.subscriptionStatus, user.subscriptionEndAt);
            expect(result).toBe(false);

            // Cleanup
            await User.findByIdAndDelete(user._id);
        });
    });
});
