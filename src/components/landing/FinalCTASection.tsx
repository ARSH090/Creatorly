'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const FinalCTASection: React.FC = () => {
    return (
        <section className="py-48 px-6 bg-[#030303] text-center border-t border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="text-6xl sm:text-8xl font-bold text-white tracking-tighter mb-8 leading-[0.85]">
                    Stop thinking.<br />
                    <span className="bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">Start building.</span>
                </h2>
                <p className="text-xl text-zinc-500 mb-14 max-w-2xl mx-auto font-medium">
                    Join the fastest growing community of Indian creators today.<br className="hidden sm:block" /> Your audience is waiting for your store.
                </p>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block relative"
                >
                    {/* Pulsing button aura */}
                    <motion.div
                        className="absolute -inset-1 rounded-2xl bg-white/30 blur-lg"
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <Link
                        href="/auth/register"
                        className="group relative flex items-center gap-3 h-20 px-12 rounded-2xl bg-white text-black font-black text-xl overflow-hidden"
                    >
                        {/* Shimmer sweep */}
                        <motion.div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50 z-10"
                            animate={{ translateX: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        />
                        <span className="uppercase tracking-tight relative z-20">Launch Your Page</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-20" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default FinalCTASection;
