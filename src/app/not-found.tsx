"use client";

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
                <h1 className="text-[12rem] font-black leading-none tracking-tighter text-white/5 select-none">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Oops! This link is broken.</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-10 font-medium">
                The page you are looking for might have been moved or doesn't exist.
                Let's get you back to building your empire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/"
                    className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95"
                >
                    Back to Home
                </Link>
                <Link
                    href="/dashboard"
                    className="px-8 py-3 bg-zinc-900 text-white border border-white/10 rounded-full font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95"
                >
                    Go to Dashboard
                </Link>
            </div>

            <p className="mt-20 text-[10px] font-bold uppercase tracking-widest text-zinc-600 italic">
                Creatorly — Empowering Bharat 🇮🇳
            </p>
        </div>
    );
}
