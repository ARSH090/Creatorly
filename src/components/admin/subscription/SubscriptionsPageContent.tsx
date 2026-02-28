'use client';

import React, { useState } from 'react';
import {
    BarChart3 as AnalyticsIcon,
    Ticket as CouponsIcon,
    History as AuditIcon,
    ShieldCheck,
    LayoutGrid,
    Zap,
    Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import PlansManagement from '@/components/admin/subscription/PlansManagement';
import CouponsManagementEnhanced from '@/components/admin/subscription/CouponsManagementEnhanced';
import SubscriptionAnalytics from '@/components/admin/subscription/SubscriptionAnalytics';

export default function SubscriptionsPageContent() {
    return (
        <div className="space-y-12 max-w-[1600px] mx-auto pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Crown className="w-12 h-12 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]" />
                    SUBSCRIPTION OPS
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Revenue Architecture • Access Control • Economic Engine
                </p>
            </header>

            <Tabs defaultValue="analytics" className="w-full space-y-10">
                <TabsList className="bg-zinc-900/40 border border-white/5 p-2 rounded-[2rem] h-20 flex justify-start gap-4 backdrop-blur-xl shrink-0 overflow-x-auto no-scrollbar">
                    <TabsTrigger
                        value="analytics"
                        className="rounded-2xl px-8 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <AnalyticsIcon className="w-4 h-4 mr-3" />
                        Intelligence
                    </TabsTrigger>
                    <TabsTrigger
                        value="plans"
                        className="rounded-2xl px-8 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <LayoutGrid className="w-4 h-4 mr-3" />
                        Tier Logic
                    </TabsTrigger>
                    <TabsTrigger
                        value="coupons"
                        className="rounded-2xl px-8 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <CouponsIcon className="w-4 h-4 mr-3" />
                        incentives
                    </TabsTrigger>
                    <TabsTrigger
                        value="audit"
                        className="rounded-2xl px-8 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <AuditIcon className="w-4 h-4 mr-3" />
                        History
                    </TabsTrigger>
                </TabsList>

                <div className="min-h-[600px]">
                    <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
                        <SubscriptionAnalytics />
                    </TabsContent>
                    <TabsContent value="plans" className="mt-0 focus-visible:outline-none">
                        <PlansManagement />
                    </TabsContent>
                    <TabsContent value="coupons" className="mt-0 focus-visible:outline-none">
                        <CouponsManagementEnhanced />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-0 focus-visible:outline-none">
                        <div className="bg-zinc-900/40 border-2 border-dashed border-white/5 rounded-[4rem] p-20 text-center space-y-8 flex flex-col items-center justify-center">
                            <div className="p-10 bg-white/5 rounded-full border border-white/10">
                                <ShieldCheck className="w-20 h-20 text-zinc-800 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">Audit Log Frequency Active</h3>
                                <p className="text-zinc-700 font-bold text-xs uppercase tracking-widest max-w-md leading-relaxed">
                                    Comprehensive tracking of tier overrides, incentive generation, and fiscal shifts is currently being logged for security review.
                                </p>
                            </div>
                            <Button variant="ghost" className="text-zinc-600 font-black text-[9px] uppercase tracking-[0.3em] hover:text-white">Request Deep Scan</Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
