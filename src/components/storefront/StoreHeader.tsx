'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import NextImage from 'next/image';

interface StoreHeaderProps {
    creator: {
        displayName: string;
        username: string;
        logo?: string;
        theme: any;
    };
}

export default function StoreHeader({ creator }: StoreHeaderProps) {
    const { user } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = creator;

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled
                ? 'bg-black/60 backdrop-blur-xl border-white/10 py-3 sm:py-4'
                : 'bg-transparent border-transparent py-4 sm:py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo / Name */}
                <Link href={`/u/${creator.username}`} className="flex items-center gap-3 group">
                    {creator.logo ? (
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden shadow-2xl">
                            <NextImage src={creator.logo} alt={creator.displayName} fill className="object-cover" />
                        </div>
                    ) : (
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-2xl"
                            style={{ backgroundColor: theme.primaryColor }}
                        >
                            {creator.displayName.charAt(0)}
                        </div>
                    )}
                    <span className="font-black text-xl tracking-tighter hidden md:block group-hover:text-zinc-300 transition-colors">
                        {creator.displayName}
                    </span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button className="p-2 sm:p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1 sm:mx-2" />

                    {isMounted && (
                        user ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
                            >
                                <span className="hidden xs:inline">Dashboard</span>
                                <User className="w-4 h-4 xs:hidden" />
                            </Link>
                        ) : (
                            <Link
                                href="/sign-in"
                                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all"
                            >
                                Join
                            </Link>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}
