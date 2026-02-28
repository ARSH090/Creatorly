'use client';
import React from 'react';
import type { TextSettings } from '@/types/storefront-blocks.types';
import { Field, BtnGroup } from './HeroSettings';

interface Props { settings: TextSettings; onChange: (p: Partial<TextSettings>) => void; }

export default function TextBlockSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Text Alignment">
                <BtnGroup options={[{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }]}
                    value={settings.textAlign || 'left'} onChange={v => onChange({ textAlign: v as any })} />
            </Field>
            <Field label="Max Width">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['sm', 'md', 'lg', 'full'] as const).map(w => (
                        <button key={w} onClick={() => onChange({ maxWidth: w })}
                            className={`py-2 text-[9px] font-bold border rounded-xl uppercase transition-all ${settings.maxWidth === w ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {w}
                        </button>
                    ))}
                </div>
            </Field>
            <Field label="Text Color">
                <div className="flex items-center gap-3">
                    <input type="color" value={settings.textColor || '#ffffff'} onChange={e => onChange({ textColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/10 bg-transparent" />
                    <span className="text-xs text-zinc-500 font-mono">{settings.textColor || 'inherit'}</span>
                </div>
            </Field>
            <Field label="Background Color">
                <div className="flex items-center gap-3">
                    <input type="color" value={settings.bgColor || 'transparent'} onChange={e => onChange({ bgColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/10 bg-transparent" />
                    <span className="text-xs text-zinc-500 font-mono">{settings.bgColor || 'transparent'}</span>
                </div>
            </Field>
            <Field label="Content (HTML)">
                <textarea rows={8} value={settings.content || ''} onChange={e => onChange({ content: e.target.value })}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 font-mono placeholder-zinc-700"
                    placeholder="<h2>Heading</h2><p>Your content here...</p>" />
                <p className="text-[10px] text-zinc-700">Supports basic HTML tags</p>
            </Field>
        </div>
    );
}
