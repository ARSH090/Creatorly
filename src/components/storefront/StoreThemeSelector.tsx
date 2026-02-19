'use client';

import React from 'react';

export interface ThemePreset {
    id: string;
    name: string;
    emoji: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    backgroundImage?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        emoji: '🌑',
        primaryColor: '#6366f1',
        backgroundColor: '#030303',
        textColor: '#ffffff',
        fontFamily: 'Outfit',
        borderRadius: '2rem',
    },
    {
        id: 'bold',
        name: 'Bold',
        emoji: '⚡',
        primaryColor: '#f59e0b',
        backgroundColor: '#0a0800',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: '0.5rem',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        emoji: '🤍',
        primaryColor: '#000000',
        backgroundColor: '#f8f8f8',
        textColor: '#111111',
        fontFamily: 'Inter',
        borderRadius: '0.75rem',
    },
    {
        id: 'neon',
        name: 'Neon',
        emoji: '🟢',
        primaryColor: '#22c55e',
        backgroundColor: '#020804',
        textColor: '#f0fff4',
        fontFamily: 'Space Grotesk',
        borderRadius: '1rem',
    },
    {
        id: 'rose',
        name: 'Rose',
        emoji: '🌸',
        primaryColor: '#e879f9',
        backgroundColor: '#0d040f',
        textColor: '#fdf4ff',
        fontFamily: 'Cabinet Grotesk',
        borderRadius: '3rem',
    },
];

interface Props {
    currentTheme: any;
    onApply: (theme: Partial<ThemePreset>) => void;
}

export default function StoreThemeSelector({ currentTheme, onApply }: Props) {
    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                ✦ Quick Themes
            </h3>
            <div className="grid grid-cols-1 gap-2">
                {THEME_PRESETS.map(preset => {
                    const isActive = currentTheme?.primaryColor === preset.primaryColor &&
                        currentTheme?.backgroundColor === preset.backgroundColor;
                    return (
                        <button
                            key={preset.id}
                            onClick={() => onApply(preset)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group
                                ${isActive
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5'
                                }`}
                        >
                            {/* Color preview */}
                            <div
                                className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/10 shadow-lg flex items-center justify-center text-lg"
                                style={{ backgroundColor: preset.backgroundColor }}
                            >
                                <span>{preset.emoji}</span>
                            </div>

                            {/* Swatches */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-indigo-300' : 'text-zinc-300 group-hover:text-white'}`}>
                                    {preset.name}
                                </p>
                                <div className="flex gap-1.5 mt-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.backgroundColor }} />
                                    <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.primaryColor }} />
                                    <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.textColor }} />
                                </div>
                            </div>

                            {isActive && (
                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                        <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5 11 4z" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
