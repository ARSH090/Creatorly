'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Route Error:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 antialiased">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-50 text-indigo-600">
                    <AlertCircle className="w-10 h-10" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8">
                        Component Error
                    </h1>
                    <p className="text-gray-500 font-medium leading-relaxed px-4">
                        A small part of the page failed to load. You can try resetting this section or go back home.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 px-4">
                    <button
                        onClick={() => reset()}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        RETRY
                    </button>

                    <Link
                        href="/"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-900 border-2 border-gray-100 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4" />
                        HOME
                    </Link>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 text-left p-4 bg-zinc-50 rounded-2xl border border-zinc-100 overflow-auto max-h-48 shadow-inner">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 px-1">Developer Insights</p>
                        <pre className="text-[10px] text-zinc-600 font-mono leading-tight">
                            {error.message}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
