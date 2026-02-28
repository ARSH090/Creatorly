'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PortalPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        if (token) {
            // Fetch content by token
            fetch(`/api/portal/content?token=${token}`)
                .then(res => res.json())
                .then(data => {
                    setContent(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    if (!token) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid Access Link</h1>
                    <p className="text-zinc-400 mb-6">This link appears to be invalid or expired.</p>
                    <Link href="/" className="text-indigo-400 hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
                <div className="animate-pulse">Loading your content...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-6">Your Content</h1>
                {content ? (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                        {/* Render content based on type */}
                        <pre className="text-sm text-zinc-400">{JSON.stringify(content, null, 2)}</pre>
                    </div>
                ) : (
                    <div className="text-zinc-400">Content not found or expired.</div>
                )}
            </div>
        </div>
    );
}
