import crypto from 'crypto';
import { OTP } from '../models/OTP';

/**
 * OTP Service for Secure Phone Verification
 */
export class OTPService {
    /**
     * Generate a 6-digit OTP and save its hash
     */
    static async generateOTP(phone: string): Promise<string> {
        // 1. Generate 6 digit pin
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash the OTP for secure storage
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(otp, salt, 1000, 64, 'sha512').toString('hex');
        const hashedOtp = `${salt}:${hash}`;

        // 3. Set expiry (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 4. Upsert OTP record
        await OTP.findOneAndUpdate(
            { phone },
            {
                hashedOtp,
                expiresAt,
                attempts: 0,
                lockedUntil: null
            },
            { upsert: true, new: true }
        );

        // 5. Integration point for SMS Provider
        await this.sendSMS(phone, otp);

        return otp; // Returning only for development/testing if needed, usually we don't
    }

    /**
     * Verify the OTP
     */
    static async verifyOTP(phone: string, inputOtp: string): Promise<{ success: boolean; message: string }> {
        const record = await OTP.findOne({ phone });

        if (!record) {
            return { success: false, message: 'OTP not found or expired' };
        }

        if (record.lockedUntil && record.lockedUntil > new Date()) {
            return { success: false, message: 'Account locked. Try again later.' };
        }

        if (new Date() > record.expiresAt) {
            return { success: false, message: 'OTP expired' };
        }

        // Verify Hash
        const [salt, storedHash] = record.hashedOtp.split(':');
        const inputHash = crypto.pbkdf2Sync(inputOtp, salt, 1000, 64, 'sha512').toString('hex');

        if (inputHash === storedHash) {
            // Success: Clean up
            await OTP.deleteOne({ phone });
            return { success: true, message: 'Verified' };
        } else {
            // Failure: Increment attempts
            record.attempts += 1;
            if (record.attempts >= 3) {
                record.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // Lock for 10 mins
            }
            await record.save();
            return { success: false, message: record.attempts >= 3 ? 'Too many attempts. Locked.' : 'Invalid code' };
        }
    }

    /**
     * Mock/Utility for sending SMS
     */
    private static async sendSMS(phone: string, otp: string) {
        console.log(`[SMS] Sending OTP ${otp} to ${phone}`);
        // TODO: Integrate MSG91 / Twilio here
        // Example: await axios.post('msg91_url', { ... })
    }
}
