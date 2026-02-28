'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function MobileStickyCTA() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past hero (~600px)
            const scrolled = window.scrollY > 600;
            setHasScrolledPastHero(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Check screen size
        const handleResize = () => {
            setIsVisible(window.innerWidth < 1024); // Only show on mobile/tablet
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isVisible || !hasScrolledPastHero) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        >
            <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 shadow-2xl">
                <Link
                    href="/auth/register"
                    className="w-full block px-6 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-center uppercase tracking-wide hover:shadow-lg hover:shadow-indigo-500/50 transition-all text-sm"
                >
                    Start Building Free
                </Link>
            </div>
        </motion.div>
    );
}
