'use client';

import React from 'react';
import { Settings, Bell, Shield, Globe, Zap } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Settings</h1>
                <p className="text-zinc-500">Manage your account preferences and global settings.</p>
            </div>

            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 divide-y divide-white/5">
                <div className="py-8 first:pt-0">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Globe className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">General Settings</h3>
                            <p className="text-xs text-zinc-500">Configure your store slug and localization.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Store Slug</label>
                            <div className="flex">
                                <span className="bg-zinc-800 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 text-zinc-500 text-sm">creatorly.in/</span>
                                <input type="text" value="john-doe" disabled className="flex-1 bg-black/50 border border-white/5 rounded-r-xl px-4 py-3 text-zinc-500 cursor-not-allowed text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                            <Zap className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Platform Preferences</h3>
                            <p className="text-xs text-zinc-500">Customize how you interact with the platform.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center py-12">
                <p className="text-zinc-600 text-sm">More settings arriving soon. 🚀</p>
            </div>
        </div>
    );
}
