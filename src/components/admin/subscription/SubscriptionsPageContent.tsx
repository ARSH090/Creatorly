'use client';

import React, { useState } from 'react';
import {
    BarChart3,
    Layers,
    Tag,
    History,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';

import PlansManagement from '@/components/admin/subscription/PlansManagement';
import CouponsManagementEnhanced from '@/components/admin/subscription/CouponsManagementEnhanced';
import SubscriptionAnalytics from '@/components/admin/subscription/SubscriptionAnalytics';

export default function SubscriptionsPageContent() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Analytics', icon: BarChart3, color: 'text-indigo-500' },
        { id: 1, label: 'Plans', icon: Layers, color: 'text-emerald-500' },
        { id: 2, label: 'Promos', icon: Tag, color: 'text-rose-500' },
        { id: 3, label: 'Audit Log', icon: History, color: 'text-amber-500' },
    ];

    return (
        <div className="space-y-12">
            {/* Breadcrumbs & Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-4">
                    <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                        <span className="text-zinc-600 hover:text-white transition-colors cursor-pointer">Admin</span>
                        <ChevronRight className="w-3 h-3 text-zinc-800" />
                        <span className="text-indigo-500">Subscriptions</span>
                    </nav>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                            <LayoutDashboard className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                            SUBSCRIPTION ENGINE
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                            Global Revenue Protocols • Tier Management Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-4 shadow-2xl backdrop-blur-md flex items-center gap-4 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 px-8 py-5 rounded-[1.8rem] transition-all duration-500 relative group overflow-hidden ${activeTab === tab.id
                                ? 'bg-white/5 text-white shadow-xl border border-white/10'
                                : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50" />
                        )}
                        <tab.icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${activeTab === tab.id ? tab.color : 'text-zinc-600'}`} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 italic">
                            {tab.label}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_-4px_10px_rgba(99,102,241,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 0 && <SubscriptionAnalytics />}
                {activeTab === 1 && <PlansManagement />}
                {activeTab === 2 && <CouponsManagementEnhanced />}
                {activeTab === 3 && (
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-20 shadow-2xl backdrop-blur-md text-center space-y-8">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto shadow-2xl">
                            <History className="w-10 h-10 text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-zinc-500 uppercase tracking-tighter italic">PROTOCOL LOG ENTRIES</h2>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Comprehensive tracking of price changes, resets, and allocations.</p>
                        </div>

                        <div className="max-w-2xl mx-auto space-y-4 text-left mt-10">
                            {[
                                { user: 'ADMIN', action: 'CREATED PLAN "PRO CREATOR"', time: '2 MINS AGO', color: 'text-emerald-500' },
                                { user: 'ADMIN', action: 'DEACTIVATED COUPON "SUMMER50"', time: '1 HOUR AGO', color: 'text-rose-500' },
                                { user: 'SYSTEM', action: 'AUTO-RENEWED 12 SUBSCRIPTIONS', time: '4 HOURS AGO', color: 'text-indigo-500' },
                            ].map((log, i) => (
                                <div key={i} className="p-6 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${log.color.replace('text', 'bg')} animate-pulse`} />
                                        <p className="text-[11px] font-black text-white italic tracking-tight uppercase">
                                            <span className="text-zinc-600 grayscale opacity-50 mr-2">[{log.user}]</span>
                                            {log.action}
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">
                                        {log.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
