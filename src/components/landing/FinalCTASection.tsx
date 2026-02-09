'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const FinalCTASection: React.FC = () => {
    return (
        <section className="py-32 px-6 bg-black text-center border-t border-white/5">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-5xl sm:text-7xl font-semibold text-white tracking-tighter mb-8 leading-[0.9]">
                    Stop thinking.<br />
                    <span className="text-zinc-600">Start building.</span>
                </h2>
                <p className="text-xl text-zinc-500 mb-12 max-w-2xl mx-auto">
                    Join the fastest growing community of Indian creators today. Your audience is waiting.
                </p>
                <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 h-16 px-10 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95"
                >
                    Launch Your Page <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </section>
    );
};

export default FinalCTASection;
