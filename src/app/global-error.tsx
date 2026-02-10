'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6 antialiased">
                <div className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-rose-50 text-rose-600 animate-pulse">
                        <AlertCircle className="w-12 h-12" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
                            System Fault
                        </h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            A critical system error occurred. Our engineers have been alerted.
                        </p>
                    </div>

                    <button
                        onClick={() => reset()}
                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-950 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" />
                        REBOOT APPLICATION
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 text-left p-4 bg-zinc-50 rounded-xl border border-zinc-200 overflow-auto max-h-48">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 px-1">Internal Debug Trace</p>
                            <pre className="text-[10px] text-zinc-600 font-mono leading-tight bg-white p-3 rounded-lg border border-zinc-100">
                                {error.message}
                                {error.stack}
                            </pre>
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
