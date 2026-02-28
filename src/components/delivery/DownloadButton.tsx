'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';

interface DownloadButtonProps {
    orderId: string;
    productId: string;
    fileName: string;
}

export default function DownloadButton({ orderId, productId, fileName }: DownloadButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleDownload = async () => {
        setStatus('loading');
        try {
            // 1. Fetch secure token from backend
            const response = await fetch('/api/delivery/generate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, productId })
            });

            const { token, error } = await response.json();
            if (error) throw new Error(error);

            // 2. Trigger download via the secure API
            window.location.href = `/api/download/${token}`;

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('[Delivery] Download failed:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={status === 'loading'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${status === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : status === 'error'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-95'
                }`}
        >
            {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
            ) : (
                <Download className="w-4 h-4" />
            )}
            {status === 'loading' ? 'Preparing...' : status === 'success' ? 'Starting...' : status === 'error' ? 'Failed' : `Download ${fileName}`}
        </button>
    );
}
