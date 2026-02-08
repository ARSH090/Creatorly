"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-red-950/10 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                <span className="text-4xl text-red-500">⚠️</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">System Glitch Detected</h1>
            <p className="text-zinc-400 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                Something went wrong on our end. This is likely a temporary issue.
                Don't worry, your data is safe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-all active:scale-95"
                >
                    Try Again
                </button>
                <Link
                    href="/"
                    className="px-8 py-3 bg-zinc-900 text-white border border-white/10 rounded-full font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95"
                >
                    Return Home
                </Link>
            </div>

            <p className="mt-12 text-xs font-mono text-zinc-600">
                Error ID: {error.digest || 'unknown_event'}
            </p>
        </div>
    );
}
