'use client';

import { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function usePhoneOTP() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const sendOTP = async (phoneNumber: string) => {
        setLoading(true);
        setError(null);

        try {
            // Initialize reCAPTCHA
            if (!(window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        // reCAPTCHA solved
                    },
                });
            }

            const appVerifier = (window as any).recaptchaVerifier;

            // Send OTP
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

            setConfirmationResult(confirmation);
            setVerificationId(confirmation.verificationId);
            setLoading(false);

            return { success: true, verificationId: confirmation.verificationId };
        } catch (err: any) {
            console.error('Send OTP error:', err);
            setError(err.message || 'Failed to send OTP');
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    const verifyOTP = async (otp: string) => {
        if (!confirmationResult) {
            setError('No verification in progress');
            return { success: false, error: 'No verification in progress' };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await confirmationResult.confirm(otp);
            const firebaseToken = await result.user.getIdToken();

            setLoading(false);
            return {
                success: true,
                firebaseToken,
                phoneNumber: result.user.phoneNumber,
            };
        } catch (err: any) {
            console.error('Verify OTP error:', err);
            setError(err.message || 'Invalid OTP');
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    return {
        sendOTP,
        verifyOTP,
        loading,
        error,
        verificationId,
    };
}
