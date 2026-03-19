'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <p className="text-red-500 mb-4">Invalid or missing reset token.</p>
                <Link href="/auth/forgot-password" title="Return to forgot password" className="text-indigo-500 hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Success!</h2>
                <p className="text-green-500 mb-4">Your password has been reset successfully.</p>
                <p className="text-zinc-400">Redirecting you to login...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h2>
            <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                    placeholder="Min 8 characters"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-colors disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
            <div className="max-w-md w-full bg-zinc-950 p-8 rounded-2xl border border-zinc-900 shadow-2xl">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
