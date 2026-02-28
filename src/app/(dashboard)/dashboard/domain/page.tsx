'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    Globe, Check, AlertCircle, Loader2,
    ExternalLink, Copy, Info, ShieldCheck,
    Zap, Link2, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton-loaders';

type DomainStatus = 'idle' | 'verifying' | 'verified' | 'failed';

export default function CustomDomainPage() {
    const { user } = useAuth();
    const [domain, setDomain] = useState('');
    const [savedDomain, setSavedDomain] = useState('');
    const [status, setStatus] = useState<DomainStatus>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [copiedRecord, setCopiedRecord] = useState('');
    const [username, setUsername] = useState('');
    const [loadingInitial, setLoadingInitial] = useState(true);

    useEffect(() => {
        fetch('/api/creator/profile')
            .then(r => r.json())
            .then(data => {
                if (data.customDomain) {
                    setSavedDomain(data.customDomain);
                    setDomain(data.customDomain);
                    setStatus(data.domainVerified ? 'verified' : 'idle');
                }
                if (data.profile?.username) setUsername(data.profile.username);
            })
            .catch(() => toast.error('Failed to sync domain registry'))
            .finally(() => setLoadingInitial(false));
    }, []);

    const handleSave = async () => {
        if (!domain.trim()) return;
        setIsSaving(true);

        try {
            const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customDomain: cleanDomain }),
            });
            if (!res.ok) throw new Error('Registry Write Failed');
            setSavedDomain(cleanDomain);
            setDomain(cleanDomain);
            setStatus('idle');
            toast.success('Domain protocol initialized. Propagating DNS...');
        } catch (err: any) {
            toast.error(err.message || 'Registry error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerify = async () => {
        setStatus('verifying');
        try {
            const res = await fetch('/api/creator/domain/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: savedDomain }),
            });
            const data = await res.json();
            if (data.verified) {
                setStatus('verified');
                toast.success('Domain handshake successful. Active.');
            } else {
                setStatus('failed');
                toast.error(data.error || 'DNS records not detected yet');
            }
        } catch {
            setStatus('failed');
            toast.error('Verification signal lost');
        }
    };

    const handleRemove = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customDomain: '' }),
            });
            setSavedDomain('');
            setDomain('');
            setStatus('idle');
            toast.success('Custom domain terminated.');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedRecord(id);
            toast.success('Copied to buffer');
            setTimeout(() => setCopiedRecord(''), 2000);
        });
    };

    const defaultUrl = `creatorly.in/u/${username}`;

    if (loadingInitial) {
        return (
            <div className="max-w-3xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-24 w-full rounded-[2rem]" />
                <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Globe className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                    DOMAIN MAPPING
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Identity Aliasing • DNS Protocols • SSL Certification
                </p>
            </header>

            {/* Default Status Card */}
            <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 flex flex-col md:flex-row items-center gap-8 group">
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-all">
                    <Link2 className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">CORE IDENTITY ENDPOINT</p>
                    <a
                        href={`/u/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl font-black text-white italic hover:text-indigo-400 transition-colors inline-flex items-center gap-2"
                    >
                        {defaultUrl}
                        <ExternalLink className="w-4 h-4 opacity-40" />
                    </a>
                </div>
                {status === 'verified' && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest italic animate-pulse">
                        <Check className="w-3 h-3 mr-2" /> ACTIVE MAPPING
                    </Badge>
                )}
            </div>

            {/* Configuration Card */}
            <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Settings className="w-6 h-6 text-zinc-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">SET CUSTOM ARTIFACT</h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder="MYSITE.COM"
                        className="flex-1 bg-black/40 border-white/10 rounded-2xl h-14 px-8 text-white font-black italic focus:ring-indigo-500/20 transition-all placeholder:text-zinc-700 uppercase"
                    />
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !domain.trim()}
                        className="h-14 px-10 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/5"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE PROTOCOL'}
                    </Button>
                </div>

                {savedDomain && (
                    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex items-start gap-5">
                            <Info className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
                            <p className="text-xs font-bold text-amber-200/80 leading-relaxed uppercase tracking-wider italic">
                                Initialize DNS artifacts in your domain registrar. Changes propagate within 12-48 verification cycles.
                            </p>
                        </div>

                        {/* DNS Table/Blocks */}
                        <div className="space-y-6">
                            {[
                                { type: 'CNAME', host: savedDomain.includes('.') ? savedDomain.split('.')[0] : '@', val: 'cname.vercel-dns.com', id: 'cname' },
                                { type: 'A', host: '@', val: '76.76.21.21', id: 'arecord', sub: '(For apex domains)' }
                            ].map((record, i) => (
                                <div key={i} className="bg-black/40 rounded-[2rem] p-8 border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-center mb-6">
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black italic px-4 py-1 tracking-widest text-[10px]">{record.type} RECORD</Badge>
                                        {record.sub && <span className="text-[9px] font-black text-zinc-600 uppercase italic">{record.sub}</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">HOST</p>
                                            <div className="flex items-center gap-3">
                                                <code className="text-white font-black italic text-sm">{record.host}</code>
                                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(record.host, record.id + 'h')} className="w-8 h-8 rounded-lg hover:bg-white/5 text-zinc-500">
                                                    <Copy size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">VALUE</p>
                                            <div className="flex items-center gap-3 justify-end">
                                                <code className="text-indigo-400 font-black italic text-sm">{record.val}</code>
                                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(record.val, record.id + 'v')} className="w-8 h-8 rounded-lg hover:bg-white/5 text-zinc-500">
                                                    <Copy size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <Button
                                onClick={handleVerify}
                                disabled={status === 'verifying'}
                                className="bg-indigo-600 text-white h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest italic shadow-xl shadow-indigo-600/20"
                            >
                                {status === 'verifying' ? <><Loader2 className="w-4 h-4 animate-spin mr-3" /> VERIFYING...</> : 'INITIATE HANDSHAKE'}
                            </Button>
                            <Button variant="ghost" onClick={handleRemove} className="text-rose-500 hover:text-rose-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                TERMINATE MAPPING
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
