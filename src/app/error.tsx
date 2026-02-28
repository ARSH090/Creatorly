'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="relative group mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-full p-8">
                    <AlertTriangle className="w-16 h-16 text-indigo-500" strokeWidth={1} />
                </div>
            </div>

            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                Archive Signal Lost
            </h1>
            <p className="max-w-md text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] leading-relaxed mb-12">
                The relay encountered an atmospheric anomaly. Deployment parameters have been logged for forensic analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={() => reset()}
                    className="bg-white text-black h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105"
                >
                    <RefreshCcw size={14} className="mr-2" />
                    Reboot Relay
                </Button>
                <Button
                    variant="outline"
                    asChild
                    className="bg-zinc-900 border-white/10 text-white h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-white/5"
                >
                    <Link href="/admin">
                        <Home size={14} className="mr-2" />
                        Return to HQ
                    </Link>
                </Button>
            </div>

            <p className="mt-12 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                Forensic Hash: {error.digest || 'Anomalous Event'}
            </p>
        </div>
    );
}
