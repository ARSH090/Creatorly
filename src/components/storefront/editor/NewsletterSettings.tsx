'use client';
import React from 'react';
import type { NewsletterSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, Toggle } from './HeroSettings';

interface Props { settings: NewsletterSettings; onChange: (p: Partial<NewsletterSettings>) => void; }

export default function NewsletterSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Heading"><Inp value={settings.heading || ''} onChange={v => onChange({ heading: v })} placeholder="Join the newsletter" /></Field>
            <Field label="Subheading"><Inp value={settings.subheading || ''} onChange={v => onChange({ subheading: v })} placeholder="Weekly tips to your inbox" /></Field>
            <Field label="Button Text"><Inp value={settings.buttonText || ''} onChange={v => onChange({ buttonText: v })} placeholder="Subscribe" /></Field>
            <Field label="Success Message"><Inp value={settings.successMessage || ''} onChange={v => onChange({ successMessage: v })} placeholder="You're in! 🎉" /></Field>
            <Field label="Lead Magnet Offer"><Inp value={settings.leadMagnet || ''} onChange={v => onChange({ leadMagnet: v })} placeholder="Get free guide when you subscribe" /></Field>
            <Toggle label="Show GDPR Checkbox" value={settings.showGdpr === true} onChange={v => onChange({ showGdpr: v })} />
            {settings.showGdpr && (
                <Field label="GDPR Checkbox Text">
                    <Inp value={settings.gdprText || ''} onChange={v => onChange({ gdprText: v })} placeholder="I agree to receive emails and accept the privacy policy" />
                </Field>
            )}
            <Field label="Integration">
                <select value={settings.provider || 'native'} onChange={e => onChange({ provider: e.target.value as any })}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50">
                    <option value="native">Creatorly (built-in)</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="convertkit">ConvertKit</option>
                </select>
            </Field>
            {settings.provider !== 'native' && (
                <Field label="Integration URL / API Key">
                    <Inp value={settings.providerUrl || ''} onChange={v => onChange({ providerUrl: v })} placeholder="Paste URL or API endpoint" />
                </Field>
            )}
        </div>
    );
}
