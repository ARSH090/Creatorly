'use client';

import React from 'react';
import { Palette, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const PRESETS = [
    {
        name: 'Indigo Glow',
        colors: {
            primaryColor: '#6366f1',
            secondaryColor: '#a855f7',
            accentColor: '#ec4899',
            backgroundColor: '#030303',
            textColor: '#ffffff',
        },
        preview: 'from-indigo-500 to-purple-600'
    },
    {
        name: 'Midnight Glass',
        colors: {
            primaryColor: '#ffffff',
            secondaryColor: '#94a3b8',
            accentColor: '#38bdf8',
            backgroundColor: '#020617',
            textColor: '#f8fafc',
        },
        preview: 'from-slate-900 to-slate-800'
    },
    {
        name: 'Cyber Neon',
        colors: {
            primaryColor: '#00ffcc',
            secondaryColor: '#ff00ff',
            accentColor: '#ffff00',
            backgroundColor: '#000000',
            textColor: '#ffffff',
        },
        preview: 'from-emerald-500 via-fuchsia-500 to-yellow-500'
    },
    {
        name: 'Rose Gold',
        colors: {
            primaryColor: '#fb7185',
            secondaryColor: '#fda4af',
            accentColor: '#fff1f2',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
        },
        preview: 'from-rose-400 to-rose-600'
    },
    {
        name: 'Forest Dark',
        colors: {
            primaryColor: '#10b981',
            secondaryColor: '#059669',
            accentColor: '#34d399',
            backgroundColor: '#064e3b',
            textColor: '#ecfdf5',
        },
        preview: 'from-emerald-800 to-teal-900'
    }
];

interface Props {
    currentTheme: any;
    onApply: (preset: any) => void;
}

export default function StoreThemeSelector({ currentTheme, onApply }: Props) {
    return (
        <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Visual Presets
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {PRESETS.map((preset) => {
                    const isSelected = currentTheme.primaryColor === preset.colors.primaryColor &&
                        currentTheme.backgroundColor === preset.colors.backgroundColor;

                    return (
                        <button
                            key={preset.name}
                            onClick={() => onApply(preset.colors)}
                            className={`group relative p-4 rounded-2xl border transition-all text-left overflow-hidden ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                                }`}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.preview} shadow-lg shadow-black/20`} />
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase italic tracking-tight">{preset.name}</p>
                                        <div className="flex gap-1 mt-1">
                                            {Object.values(preset.colors).slice(0, 3).map((c: any, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Decorative background pulse */}
                            {isSelected && (
                                <motion.div
                                    layoutId="presetGlow"
                                    className="absolute inset-0 bg-indigo-500/5 backdrop-blur-3xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
