'use client';
import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { LinksSettings, LinkButton } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props { settings: LinksSettings; onChange: (patch: Partial<LinksSettings>) => void; }

const newBtn = (order: number): LinkButton => ({
    id: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: 'New Link', url: 'https://', isActive: true, order,
    linkType: 'link', iconName: 'ExternalLink',
});

export default function LinksSettingsPanel({ settings, onChange }: Props) {
    const buttons = settings.buttons || [];

    const update = (idx: number, patch: Partial<LinkButton>) => {
        const next = buttons.map((b, i) => i === idx ? { ...b, ...patch } : b);
        onChange({ buttons: next });
    };

    const add = () => onChange({ buttons: [...buttons, newBtn(buttons.length)] });
    const remove = (idx: number) => onChange({ buttons: buttons.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Button Style">
                <div className="grid grid-cols-3 gap-1.5">
                    {(['filled', 'outline', 'ghost', 'pill', 'neon', 'glass'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => onChange({ buttonStyle: s })}
                            className={`py-2 text-[9px] font-bold border rounded-xl transition-all capitalize ${settings.buttonStyle === s ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </Field>

            <Toggle label="Show Thumbnails" value={settings.showThumbnails !== false} onChange={v => onChange({ showThumbnails: v })} />

            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Links ({buttons.length})</p>
                <button onClick={add} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg transition-colors">
                    <Plus size={11} /> Add
                </button>
            </div>

            <div className="space-y-3">
                {buttons.map((btn, idx) => (
                    <div key={btn.id} className="border border-white/8 bg-black/20 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <GripVertical size={14} className="text-zinc-700 flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-1">
                                <input
                                    className="w-full bg-transparent text-xs font-bold text-white placeholder-zinc-700 focus:outline-none"
                                    value={btn.title}
                                    onChange={e => update(idx, { title: e.target.value })}
                                    placeholder="Button Title"
                                />
                                <input
                                    className="w-full bg-transparent text-[11px] text-zinc-500 placeholder-zinc-700 focus:outline-none"
                                    value={btn.url}
                                    onChange={e => update(idx, { url: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>
                            <button
                                onClick={() => update(idx, { isActive: !btn.isActive })}
                                className={`w-8 h-5 rounded-full flex-shrink-0 relative transition-colors ${btn.isActive ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${btn.isActive ? 'translate-x-3' : ''}`} />
                            </button>
                            <button onClick={() => remove(idx)} className="p-1 hover:text-rose-400 text-zinc-700">
                                <Trash2 size={13} />
                            </button>
                        </div>

                        <div className="border-t border-white/5 px-3 py-2.5 space-y-2">
                            <Field label="Badge Text">
                                <Inp value={btn.badgeText || ''} onChange={v => update(idx, { badgeText: v })} placeholder="NEW, HOT, FREE…" />
                            </Field>
                            <Field label="Description">
                                <Inp value={btn.description || ''} onChange={v => update(idx, { description: v })} placeholder="Optional" />
                            </Field>
                            <Field label="Thumbnail URL">
                                <Inp value={btn.thumbnail || ''} onChange={v => update(idx, { thumbnail: v })} placeholder="https://..." />
                            </Field>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Show From">
                                    <input type="datetime-local" value={btn.scheduleStart || ''} onChange={e => update(idx, { scheduleStart: e.target.value })} className="w-full bg-black/30 border border-white/8 rounded-xl px-2 py-1.5 text-[10px] text-zinc-400 focus:outline-none" />
                                </Field>
                                <Field label="Hide After">
                                    <input type="datetime-local" value={btn.scheduleEnd || ''} onChange={e => update(idx, { scheduleEnd: e.target.value })} className="w-full bg-black/30 border border-white/8 rounded-xl px-2 py-1.5 text-[10px] text-zinc-400 focus:outline-none" />
                                </Field>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
