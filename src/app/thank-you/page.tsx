'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, Mail } from 'lucide-react';

export default function ThankYouPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order');
    const email = searchParams.get('email');

    return (
        <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                </div>

                <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
                <p className="text-zinc-400 mb-8">
                    Your order has been confirmed. We&apos;ve sent a confirmation email 
                    {email && ` to ${email}`} with your download links.
                </p>

                <div className="space-y-4">
                    {orderId && (
                        <Link
                            href={`/orders/${orderId}`}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-100 transition-colors"
                        >
                            <Download size={20} />
                            View Order & Downloads
                        </Link>
                    )}

                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                        <Mail size={16} />
                        <span>Check your email for download links</span>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <Link href="/" className="text-indigo-400 hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
