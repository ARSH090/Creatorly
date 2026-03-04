'use client';

import { Edit3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useUser } from '@clerk/nextjs';

export default function EditStorefrontButton({ creatorUsername }: { creatorUsername: string }) {
    const { user, isLoaded } = useUser();

    if (!isLoaded || !user) return null;

    const isOwner = user.username === creatorUsername || (user.unsafeMetadata as any)?.username === creatorUsername;
    if (!isOwner) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-[9999]"
        >
            <Link
                href="/dashboard/storefront/editor"
                className="group relative flex items-center gap-3 bg-indigo-600 px-6 py-4 rounded-3xl text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-[0_20px_50px_-12px_rgba(79,70,229,0.5)] active:scale-95 overflow-hidden"
            >
                {/* Pulse Effect */}
                <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl shadow-inner">
                        <Edit3 className="w-4 h-4 text-white" />
                    </div>
                    <span className="drop-shadow-sm">Advance Editor</span>
                </div>

                {/* Ambient Pulse Ring */}
                <div className="absolute -inset-1 bg-indigo-500 rounded-[2rem] opacity-20 group-hover:animate-ping -z-10" />
            </Link>
        </motion.div>
    );
}
