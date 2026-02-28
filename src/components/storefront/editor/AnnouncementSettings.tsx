'use client';
import React from 'react';
import type { AnnouncementSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, Toggle } from './HeroSettings';

interface Props { settings: AnnouncementSettings; onChange: (p: Partial<AnnouncementSettings>) => void; }

export default function AnnouncementSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Announcement Text"><Inp value={settings.text || ''} onChange={v => onChange({ text: v })} placeholder="🎉 New product just dropped!" /></Field>
            <Field label="Emoji"><Inp value={settings.emoji || ''} onChange={v => onChange({ emoji: v })} placeholder="🎉" /></Field>
            <Field label="CTA Button Text"><Inp value={settings.ctaText || ''} onChange={v => onChange({ ctaText: v })} placeholder="Shop Now" /></Field>
            <Field label="CTA URL"><Inp value={settings.ctaUrl || ''} onChange={v => onChange({ ctaUrl: v })} placeholder="https://..." /></Field>
            <Field label="Background Color">
                <div className="flex items-center gap-3">
                    <input type="color" value={settings.bgColor || '#6366f1'} onChange={e => onChange({ bgColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/10 bg-transparent" />
                    <span className="text-xs text-zinc-500 font-mono">{settings.bgColor || '#6366f1'}</span>
                </div>
            </Field>
            <Toggle label="Sticky (top of page)" value={settings.sticky === true} onChange={v => onChange({ sticky: v })} />
            <Toggle label="Visitor can dismiss" value={settings.dismissable !== false} onChange={v => onChange({ dismissable: v })} />
            <div className="grid grid-cols-2 gap-2">
                <Field label="Show From">
                    <input type="datetime-local" value={settings.scheduleStart || ''} onChange={e => onChange({ scheduleStart: e.target.value })}
                        className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none" />
                </Field>
                <Field label="Hide After">
                    <input type="datetime-local" value={settings.scheduleEnd || ''} onChange={e => onChange({ scheduleEnd: e.target.value })}
                        className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none" />
                </Field>
            </div>
        </div>
    );
}
