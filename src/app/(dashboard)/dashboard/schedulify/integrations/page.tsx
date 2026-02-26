'use client';

import React from 'react';
import {
    Video, Globe, Mail, Zap, ExternalLink,
    CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

const INTEGRATIONS = [
    {
        id: 'zoom',
        name: 'Zoom Video',
        icon: Video,
        desc: 'Generate unique Zoom meeting links for every booking automatically.',
        status: 'disconnected',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 'google-cal',
        name: 'Google Calendar',
        icon: Globe,
        desc: 'Sync your bookings to your calendar and check for conflicts in real-time.',
        status: 'connected',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'razorpay',
        name: 'Razorpay',
        icon: Zap,
        desc: 'Accept payments for your sessions directly from the booking page.',
        status: 'connected',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10'
    },
];

export default function IntegrationsPage() {
    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Integrations</h1>
                <p className="text-zinc-500">Connect Schedulify with your favorite tools to automate your workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INTEGRATIONS.map((app) => (
                    <div key={app.id} className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 flex flex-col group hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between mb-8">
                            <div className={`p-4 rounded-[1.5rem] ${app.bg} ${app.color}`}>
                                <app.icon className="w-8 h-8" />
                            </div>
                            {app.status === 'connected' ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-800 px-3 py-1 rounded-full">
                                    Disconnected
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-8 flex-1">
                            {app.desc}
                        </p>

                        <div className="pt-6 border-t border-white/5">
                            {app.status === 'connected' ? (
                                <div className="flex items-center justify-between">
                                    <button className="text-xs font-bold text-zinc-500 hover:text-rose-400 transition-colors">Disconnect</button>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300">
                                        Configure <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">
                                    Connect Now
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Coming Soon Section */}
            <div className="pt-12">
                <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] mb-8 text-center">More Apps Coming Soon</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                    {['Slack', 'Discord', 'Notion', 'Zapier', 'Teams', 'Outlook'].map((name) => (
                        <div key={name} className="bg-zinc-900/30 rounded-2xl p-4 border border-white/5 text-center flex flex-col items-center gap-2">
                            <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
                            <span className="text-[10px] font-bold text-zinc-500">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
