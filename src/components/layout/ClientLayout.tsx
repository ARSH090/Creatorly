'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNavigation from '@/components/navigation/MobileNavigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Routes that should NOT have the global header/footer
    const isDashboard = pathname?.startsWith('/dashboard');
    const isStorefront = pathname?.startsWith('/u/');
    const isAdmin = pathname?.startsWith('/admin');
    const isAuth = pathname?.startsWith('/auth');
    const isCart = pathname?.startsWith('/cart');

    const showGlobalNav = !isDashboard && !isStorefront && !isAdmin && !isAuth && !isCart;
    const isHome = pathname === '/';

    return (
        <div className="min-h-screen flex flex-col bg-transparent">
            {showGlobalNav && <Header />}
            <main className={`flex-1 site-content ${showGlobalNav && !isHome ? 'pt-16' : ''}`}>
                {children}
            </main>
            {showGlobalNav && <Footer />}

            <MobileNavigation />
        </div>
    );
}
