'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, Heart, User } from 'lucide-react';

export default function MobileNavigation() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Demo', href: '/u/demo', icon: Compass },
        { name: 'Create', href: '/auth/register', icon: PlusSquare }, // Central action
        { name: 'Cart', href: '/cart', icon: Heart },
        { name: 'Profile', href: '/dashboard', icon: User },
    ];

    // Hide on flows that already provide their own navigation chrome
    if (
        !pathname ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/u/') ||
        pathname.startsWith('/cart') ||
        pathname.startsWith('/setup')
    ) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 md:hidden z-50 pb-safe">
            <div className="flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 ${isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive && 'fill-black'}`} strokeWidth={isActive ? 2.5 : 2} />
                            {/* Optional Label 
                            <span className="text-[10px] font-medium">{item.name}</span>
                            */}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
