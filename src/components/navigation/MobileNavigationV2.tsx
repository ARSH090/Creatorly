'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, Heart, User } from 'lucide-react';

export default function MobileNavigation() {
    const pathname = usePathname();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Demo', href: '/u/demo', icon: Compass },
        { name: 'Create', href: '/auth/register', icon: PlusSquare },
        { name: 'Cart', href: '/cart', icon: Heart },
        { name: 'Profile', href: '/dashboard', icon: User },
    ];

    if (!mounted) return null;

    // Hide on flows that already provide their own complex navigation chrome
    // Note: We explicitly ALLOW /cart now as requested
    if (
        !pathname ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/u/') ||
        pathname.startsWith('/setup')
    ) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/98 backdrop-blur-2xl border-t border-white/10 px-6 py-4 md:hidden z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-zinc-600 hover:text-white/60 transition-colors'
                                }`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'text-indigo-400' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
