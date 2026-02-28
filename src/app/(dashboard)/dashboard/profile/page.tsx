'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
    User, Mail, Shield, Save, Camera,
    Loader2, ExternalLink, QrCode, Sparkles,
    CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton-loaders';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [loadingInitial, setLoadingInitial] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        username: '',
        bio: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.fullName || user.username || '',
                email: user.primaryEmailAddress?.emailAddress || '',
                username: user.username || prev.username,
            }));

            fetch('/api/creator/profile')
                .then(res => res.json())
                .then(data => {
                    const profileData = data.profile || {};
                    setFormData(prev => ({
                        ...prev,
                        displayName: profileData.displayName || user.fullName || '',
                        username: profileData.username || user.username || '',
                        bio: profileData.bio || '',
                        email: profileData.email || user.primaryEmailAddress?.emailAddress || ''
                    }));
                    if (profileData.avatar) setAvatarUrl(profileData.avatar);
                })
                .catch(() => toast.error('Failed to sync profile telemetry'))
                .finally(() => setLoadingInitial(false));
        }
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Payload too large (Max 5MB)');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const presignRes = await fetch('/api/creator/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    fileSize: file.size,
                }),
            });
            if (!presignRes.ok) throw new Error('Registry Write Failed');
            const { uploadUrl, publicUrl } = await presignRes.json();

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!uploadRes.ok) throw new Error('S3 Link Dead');

            await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: publicUrl }),
            });

            setAvatarUrl(publicUrl);
            toast.success('Visual artifact updated.');
            if (user?.reload) await user.reload();
        } catch (err: any) {
            toast.error('Identity upload failed.');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Profile synchronization complete.');
                if (user?.reload) await user.reload();
            } else {
                throw new Error('Sync failed');
            }
        } catch {
            toast.error('Internal protocol error.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingInitial) {
        return (
            <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Skeleton className="h-[400px] w-full rounded-[3rem]" />
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[600px] w-full rounded-[3rem]" />
                    </div>
                </div>
            </div>
        );
    }

    const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
    }) : 'Feb 2024';

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <User className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                    CREATOR PROFILE
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Identity Core • Public Presence • System Authorization
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Identity Card */}
                <div className="space-y-8">
                    <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 flex flex-col items-center text-center group">
                        <div className="relative mb-8 pt-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 border-4 border-white/10 overflow-hidden shadow-2xl relative">
                                {isUploadingAvatar ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                                    </div>
                                ) : (
                                    <Image
                                        src={avatarUrl || user?.imageUrl || '/avatar-placeholder.png'}
                                        alt="Identity"
                                        fill
                                        sizes="160px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        priority
                                    />
                                )}
                            </div>
                            <Button
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 w-12 h-12 bg-white text-black rounded-full border-4 border-black hover:bg-zinc-200 shadow-xl transition-all hover:scale-110"
                            >
                                <Camera size={20} />
                            </Button>
                        </div>

                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">
                            {formData.displayName || user?.fullName}
                        </h2>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 italic">
                            @{formData.username}
                        </p>

                        <div className="flex gap-3">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic animate-pulse">
                                <Sparkles className="w-3 h-3 mr-2" /> PRO CREATOR
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5 space-y-6">
                        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">ACCOUNT TELEMETRY</h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Auth Level', val: 'Level 4 Creator' },
                                { label: 'Initialization', val: joinedDate.toUpperCase() },
                                { label: 'Verification', val: 'Verified SSL', color: 'text-emerald-400' }
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-black italic">
                                    <span className="text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                                    <span className={cn("text-white", stat.color)}>{stat.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSave} className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">IDENTITY CORE</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alias Name</label>
                                <Input
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="bg-black/40 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20"
                                    placeholder="PUBLIC ALIAS"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Username</label>
                                <Input
                                    value={formData.username}
                                    disabled
                                    className="bg-black/60 border-white/5 rounded-2xl h-14 px-6 text-zinc-600 font-black italic cursor-not-allowed border-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Secure Email</label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    value={formData.email}
                                    disabled
                                    className="bg-black/60 border-white/5 rounded-2xl h-14 pl-14 pr-6 text-zinc-600 font-black italic cursor-not-allowed border-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Biography</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="w-full bg-black/40 border border-white/10 rounded-[2rem] px-8 py-6 text-white font-black italic focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500/30 transition-all resize-none placeholder:text-zinc-700"
                                placeholder="INITIALIZE YOUR NARRATIVE..."
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="h-16 px-12 bg-white text-black font-black uppercase text-xs tracking-[0.2em] italic rounded-[2rem] hover:scale-105 transition-all shadow-2xl shadow-white/5"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3" />}
                                SYNC CORE
                            </Button>
                        </div>
                    </form>

                    {/* QR & Public Link */}
                    <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="p-6 bg-white rounded-[2rem] shadow-2xl group hover:scale-105 transition-all duration-500">
                                <QRCodeSVG
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/u/${formData.username}` : ''}
                                    size={160}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
                                        <QrCode className="text-zinc-500" /> ARTIFACT QR
                                    </h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2 italic">
                                        Scan to project identity onto mobile interfaces.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => window.open(`/u/${formData.username}`, '_blank')}
                                    className="bg-indigo-600 text-white h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
                                >
                                    OPEN PUBLIC ARTIFACT <ExternalLink size={14} className="ml-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
