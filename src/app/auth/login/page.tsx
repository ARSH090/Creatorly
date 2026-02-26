'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: formData.identifier,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // SubscriptionGuard redirects active/trialing users to /dashboard automatically
        window.location.href = '/dashboard';
      } else {
        setError('Additional steps required. Please check your email.');
      }
    } catch (err: any) {
      if (err.errors?.[0]?.meta?.paramName === 'captcha') {
        setError('CAPTCHA check failed. Please refresh and try again.');
      } else {
        setError(err.errors?.[0]?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#0A0A0A]/60 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Welcome Back</h1>
              <p className="text-zinc-500 text-base font-medium">Continue your creator journey.</p>
            </div>

            <div className="space-y-8 relative z-10">
              <div id="clerk-captcha" />

              {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-6 py-4.5 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-white placeholder-zinc-600 text-base"
                    placeholder="user@example.com"
                    value={formData.identifier}
                    onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-6 py-4.5 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-white placeholder-zinc-600 text-base"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                  <div className="text-right px-1">
                    <Link href="/auth/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-white text-black rounded-2xl font-black text-base uppercase tracking-tight hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-sm text-zinc-500 font-medium">
                  New to Creatorly?
                  <Link href="/auth/register" className="text-white hover:underline ml-2 font-bold transition-all">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

