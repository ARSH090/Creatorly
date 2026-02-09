'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { signIn, signInWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signIn(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError('Failed to sign in. Please try again.');
            }
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Google login error:', err);
            setError('Failed to sign in with Google. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden flex items-center justify-center p-6">
            {/* Background Noise & Grid */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <div className="relative w-full max-w-md z-10">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

                <div className="bg-zinc-900/40 border border-white/8 backdrop-blur-3xl rounded-4xl p-8 md:p-12">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Welcome Back</h1>
                        <p className="text-zinc-500 text-sm">Access your professional infrastructure.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20 mb-8 animate-in fade-in slide-in-from-top-2">
                            ✗ {error}
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] font-bold text-sm"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.6 12.227C21.6 11.549 21.547 10.953 21.444 10.381H12v3.889h5.787c-.249 1.342-.98 2.486-2.093 3.265v2.717h3.387c1.983-1.828 3.119-4.515 3.119-7.87z" fill="#4285F4" />
                                <path d="M12 22c2.7 0 4.966-.89 6.622-2.41l-3.387-2.717c-.94.633-2.144 1.01-3.235 1.01-2.487 0-4.598-1.68-5.352-3.94H2.993v2.47C4.64 19.99 8.02 22 12 22z" fill="#34A853" />
                                <path d="M6.648 13.943a6.6 6.6 0 010-3.886V7.588H2.993a10.998 10.998 0 000 8.823l3.655-2.058z" fill="#FBBC05" />
                                <path d="M12 5.5c1.468 0 2.792.505 3.835 1.49l2.876-2.876C16.961 2.47 14.695 1.6 12 1.6 8.02 1.6 4.64 3.61 2.993 6.412l3.655 2.47C7.402 7.18 9.513 5.5 12 5.5z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                            <span className="bg-[#0e0e0e] px-3 text-zinc-600">Or using email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                                placeholder="name@work-email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link href="/auth/forgot-password" className="text-xs text-zinc-500 hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Please wait...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
                            New to the infrastructure? {' '}
                            <Link href="/auth/register" className="text-white hover:underline transition-colors lowercase ml-1">
                                Create an account
                            </Link>
                        </p>
                        <div className="flex justify-center gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                            <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                            <Link href="/terms-of-service" className="hover:text-zinc-400 transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
