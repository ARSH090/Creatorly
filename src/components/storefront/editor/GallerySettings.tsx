'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GallerySettings, GalleryImage } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';

interface Props { settings: GallerySettings; onChange: (p: Partial<GallerySettings>) => void; }

const newImg = (): GalleryImage => ({ id: `img_${Date.now()}`, url: '', caption: '' });

export default function GallerySettingsPanel({ settings, onChange }: Props) {
    const images = settings.images || [];
    const update = (idx: number, patch: Partial<GalleryImage>) =>
        onChange({ images: images.map((im, i) => i === idx ? { ...im, ...patch } : im) });
    const remove = (idx: number) => onChange({ images: images.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Title"><Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="Gallery" /></Field>
            <Field label="Display Mode">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['grid', 'masonry', 'carousel', 'lightbox'] as const).map(m => (
                        <button key={m} onClick={() => onChange({ displayMode: m })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.displayMode === m ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </Field>
            <Field label="Aspect Ratio">
                <BtnGroup options={[{ v: 'square', l: 'Square' }, { v: 'landscape', l: 'Wide' }, { v: 'portrait', l: 'Tall' }]}
                    value={settings.aspectRatio || 'square'} onChange={v => onChange({ aspectRatio: v as any })} />
            </Field>
            <Field label="Columns">
                <BtnGroup options={[{ v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4', l: '4' }]}
                    value={String(settings.columns || 3)} onChange={v => onChange({ columns: Number(v) as 2 | 3 | 4 })} />
            </Field>
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Images ({images.length})</p>
                <button onClick={() => onChange({ images: [...images, newImg()] })} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
                    <Plus size={11} /> Add
                </button>
            </div>
            {images.map((img, idx) => (
                <div key={img.id} className="border border-white/8 bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-600">Image {idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-zinc-700 hover:text-rose-400"><Trash2 size={12} /></button>
                    </div>
                    <Field label="Image URL"><Inp value={img.url} onChange={v => update(idx, { url: v })} placeholder="https://..." /></Field>
                    <Field label="Caption (optional)"><Inp value={img.caption || ''} onChange={v => update(idx, { caption: v })} placeholder="Short caption" /></Field>
                </div>
            ))}
        </div>
    );
}
