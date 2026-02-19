'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Check, AlertCircle, Loader2, ExternalLink, Copy, Info } from 'lucide-react';

type DomainStatus = 'idle' | 'verifying' | 'verified' | 'failed';

export default function CustomDomainPage() {
    const { user } = useAuth();
    const [domain, setDomain] = useState('');
    const [savedDomain, setSavedDomain] = useState('');
    const [status, setStatus] = useState<DomainStatus>('idle');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [copiedRecord, setCopiedRecord] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Fetch existing custom domain setting
        fetch('/api/creator/profile')
            .then(r => r.json())
            .then(data => {
                if (data.customDomain) {
                    setSavedDomain(data.customDomain);
                    setDomain(data.customDomain);
                    setStatus(data.domainVerified ? 'verified' : 'idle');
                }
                if (data.username) setUsername(data.username);
            })
            .catch(console.error);
    }, []);

    const handleSave = async () => {
        if (!domain.trim()) return;
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customDomain: cleanDomain }),
            });
            if (!res.ok) throw new Error('Failed to save domain');
            setSavedDomain(cleanDomain);
            setDomain(cleanDomain);
            setStatus('idle');
            setMessage({ type: 'success', text: 'Domain saved! Add the DNS records below, then click Verify.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerify = async () => {
        setStatus('verifying');
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/creator/domain/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: savedDomain }),
            });
            const data = await res.json();
            if (data.verified) {
                setStatus('verified');
                setMessage({ type: 'success', text: 'Domain verified! Your profile is live at ' + savedDomain });
            } else {
                setStatus('failed');
                setMessage({ type: 'error', text: data.error || 'DNS records not detected yet. This can take up to 48 hours.' });
            }
        } catch {
            setStatus('failed');
            setMessage({ type: 'error', text: 'Verification failed. Please try again.' });
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remove custom domain?')) return;
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
            setMessage({ type: 'success', text: 'Custom domain removed.' });
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedRecord(id);
            setTimeout(() => setCopiedRecord(''), 2000);
        });
    };

    const defaultUrl = `creatorly.in/u/${username}`;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Custom Domain</h1>
                <p className="text-zinc-500">Point your own domain to your Creatorly profile.</p>
            </div>

            {/* Current Default URL */}
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Globe className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-zinc-500 mb-0.5">Your default URL</p>
                    <a
                        href={`/u/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium text-sm hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                        {defaultUrl}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                {status === 'verified' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Active
                    </span>
                )}
            </div>

            {/* Domain Input Card */}
            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 space-y-5">
                <h2 className="text-lg font-bold text-white">Set Custom Domain</h2>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder="mysite.com or links.mysite.com"
                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !domain.trim()}
                        className="px-5 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${message.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* DNS Records */}
            {savedDomain && (
                <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 space-y-5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-white">DNS Configuration</h2>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">required</span>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>Add these records in your domain registrar&apos;s DNS settings. Changes can take up to 48 hours to propagate.</p>
                    </div>

                    <div className="space-y-3">
                        {/* CNAME Record */}
                        <div className="bg-black rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">CNAME Record</p>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                    <p className="text-zinc-600 mb-1">Type</p>
                                    <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded">CNAME</p>
                                </div>
                                <div>
                                    <p className="text-zinc-600 mb-1">Name / Host</p>
                                    <div className="flex items-center gap-1">
                                        <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded flex-1 truncate">
                                            {savedDomain.includes('.') ? savedDomain.split('.')[0] : '@'}
                                        </p>
                                        <button onClick={() => copyToClipboard(savedDomain.split('.')[0] || '@', 'host')} className="p-1 hover:text-white text-zinc-500">
                                            {copiedRecord === 'host' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-zinc-600 mb-1">Value / Points to</p>
                                    <div className="flex items-center gap-1">
                                        <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded flex-1 truncate">cname.vercel-dns.com</p>
                                        <button onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname')} className="p-1 hover:text-white text-zinc-500">
                                            {copiedRecord === 'cname' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* A Record (apex) */}
                        <div className="bg-black rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                                A Record <span className="normal-case text-zinc-600 font-normal">(only if using apex domain e.g. mysite.com)</span>
                            </p>
                            <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                                <div>
                                    <p className="text-zinc-600 mb-1">Type</p>
                                    <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded">A</p>
                                </div>
                                <div>
                                    <p className="text-zinc-600 mb-1">Name / Host</p>
                                    <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded">@</p>
                                </div>
                                <div>
                                    <p className="text-zinc-600 mb-1">Value</p>
                                    <div className="flex items-center gap-1">
                                        <p className="font-mono text-white bg-zinc-900 px-2 py-1 rounded flex-1">76.76.21.21</p>
                                        <button onClick={() => copyToClipboard('76.76.21.21', 'arecord')} className="p-1 hover:text-white text-zinc-500">
                                            {copiedRecord === 'arecord' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verify Button */}
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={handleVerify}
                            disabled={status === 'verifying'}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-sm"
                        >
                            {status === 'verifying' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Checking DNS…</>
                            ) : status === 'verified' ? (
                                <><Check className="w-4 h-4" /> Re-verify</>
                            ) : (
                                'Verify Domain'
                            )}
                        </button>

                        {savedDomain && (
                            <button
                                onClick={handleRemove}
                                disabled={isSaving}
                                className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
                            >
                                Remove domain
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Status Badge */}
            {status === 'verified' && (
                <div className="flex items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                        <p className="text-emerald-400 font-bold text-sm">Domain Active</p>
                        <p className="text-emerald-400/70 text-xs mt-0.5">
                            Your profile is accessible at <a href={`https://${savedDomain}`} target="_blank" rel="noopener noreferrer" className="underline">{savedDomain}</a>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
