'use client';

import React from 'react';
import { Users, UserPlus, Shield, Info } from 'lucide-react';

export default function TeamPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Team Management</h1>
                    <p className="text-zinc-500">Collaborate with your team members and manage permissions.</p>
                </div>
                <button className="bg-white text-black font-bold py-3 px-6 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                    <UserPlus className="w-5 h-5" />
                    Invite Member
                </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                <Info className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-amber-500 font-bold mb-1">Plan Limit Reached</h3>
                    <p className="text-amber-500/80 text-sm">
                        Your current <span className="font-bold">Basic</span> plan doesn&apos;t support team collaboration.
                        Upgrade to <span className="font-bold">Pro</span> to add up to 3 team members.
                    </p>
                </div>
            </div>

            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 opacity-50 grayscale pointer-events-none">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-white">Active Members</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800" />
                            <div>
                                <p className="text-white font-bold text-sm">John Doe (You)</p>
                                <p className="text-xs text-zinc-500">john@example.com</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-white/5 text-zinc-400 text-[10px] font-bold rounded uppercase">Owner</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
