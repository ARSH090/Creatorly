'use client';

import React, { useState, useEffect } from "react";
import {
    LayoutDashboard, Package, ShoppingCart, TrendingUp,
    Users, Wallet, Settings, Bell, LogOut, ChevronRight,
    Sparkles, Plus, Share2, Menu, X, User, CreditCard, Folder, LifeBuoy,
    Mail, Globe, Zap
} from "lucide-react";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/v1/dashboard/summary');
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                setStats({
                    todayRevenue: (data.revenue?.today || 0).toLocaleString('en-IN'),
                    todayVisitors: data.leads?.new_today || 0,
                    isLive: data.store?.isLive,
                    username: data.store?.username,
                    subscription: data.subscription,
                    profile: {
                        displayName: user.fullName,
                        avatar: user.imageUrl
                    }
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, [user]);

    const navigation = [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'My Profile', icon: User, href: '/dashboard/profile' },
        { name: 'Storefront', icon: Sparkles, href: '/dashboard/storefront' },
        { name: 'Custom Domain', icon: Globe, href: '/dashboard/domain', featureCode: 'customDomain' },
        { name: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
        { name: 'Projects', icon: Folder, href: '/dashboard/projects' },
        { name: 'Orders', icon: ShoppingCart, href: '/dashboard/orders' },
        { name: 'Analytics', icon: TrendingUp, href: '/dashboard/analytics', featureCode: 'analytics' },
        { name: 'Marketing', icon: Mail, href: '/dashboard/email', featureCode: 'marketing' },
        { name: 'AutoDM Hub', icon: Zap, href: '/dashboard/automation', featureCode: 'automation' },
        { name: 'Team', icon: Users, href: '/dashboard/team', featureCode: 'teamMembers' },
        { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
        { name: 'Support', icon: LifeBuoy, href: '/dashboard/support' },
    ];

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Brand & Mobile Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    <Sparkles className="w-4 h-4 text-white fill-white" />
                                </div>
                                <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Creatorly</span>
                            </Link>

                            {/* Quick Stats - Desktop Only */}
                            <div className="hidden md:flex items-center gap-6 ml-8 pl-8 border-l border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stats?.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                        {stats?.isLive ? 'Store Live' : 'Store Offline'}
                                    </span>
                                </div>

                                {stats && (
                                    <>
                                        <div className="text-xs">
                                            <span className="text-zinc-500 font-medium">Today</span>
                                            <span className="font-bold text-white ml-2">₹{stats.todayRevenue}</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-zinc-500 font-medium">Visitors</span>
                                            <span className="font-bold text-white ml-2">{stats.todayVisitors}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: User & Actions */}
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors group">
                                <Bell className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#030303]" />
                                )}
                            </button>

                            {/* User Menu */}
                            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-none mb-1">
                                        {stats?.profile?.displayName || user?.fullName || 'Creator'}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                        @{user?.username || 'username'}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 overflow-hidden">
                                    {(stats?.profile?.avatar || user?.imageUrl) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={stats?.profile?.avatar || user?.imageUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                                            {(stats?.profile?.displayName || user?.fullName || 'C').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Trial Banner */}
            {stats?.subscription?.status === 'trialing' && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 px-4 flex items-center justify-between shadow-lg shadow-indigo-500/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Zap className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                        <p className="text-[11px] font-black text-white uppercase tracking-widest italic">
                            Trial active: {Math.max(0, Math.ceil((new Date(stats.subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining
                        </p>
                    </div>
                    <Link href="/dashboard/billing" className="bg-white text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-md">
                        Upgrade Now
                    </Link>
                </div>
            )}

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#050505] overflow-y-auto">
                    <nav className="p-4 space-y-1 flex-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const isLocked = item.featureCode && stats?.subscription && (
                                (item.featureCode === 'customDomain' && !stats.subscription.tier?.includes('business')) ||
                                (item.featureCode === 'teamMembers' && stats.subscription.tier === 'free')
                            );

                            return (
                                <Link
                                    key={item.name}
                                    href={isLocked ? '/dashboard/billing' : item.href}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all group ${isActive
                                        ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                        } ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isLocked && <Zap className="w-3 h-3 text-indigo-500" />}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Actions */}
                    <div className="p-4 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link href="/dashboard/projects/new" className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/5">
                                <Plus className="w-4 h-4" />
                                New Product
                            </Link>
                            <button
                                onClick={() => {
                                    if (user && (user as any).username) {
                                        const url = `${window.location.origin}/u/${(user as any).username}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Store URL copied to clipboard!');
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-800 transition-all">
                                <Share2 className="w-4 h-4" />
                                Share Store
                            </button>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-3 mt-6 text-zinc-600 hover:text-red-400 transition-colors rounded-xl text-sm font-medium hover:bg-red-500/5 group"
                        >
                            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-white/10 p-6 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <Link href="/dashboard" className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white fill-white" />
                                        </div>
                                        <span className="text-xl font-bold text-white tracking-tight">Creatorly</span>
                                    </Link>
                                    <button onClick={() => setIsMobileMenuOpen(false)}>
                                        <X className="w-6 h-6 text-zinc-500" />
                                    </button>
                                </div>

                                <nav className="space-y-1 flex-1">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#030303] relative">
                    {/* Global background noise */}
                    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                    <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
