'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Shield, Save, Camera,
    Loader2, ExternalLink, QrCode, Sparkles,
    CheckCircle2, AlertCircle, Trash2, Instagram,
    Twitter, Linkedin, Youtube, Globe, LayoutDashboard
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
    const router = useRouter();
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
        socialLinks: {
            instagram: '',
            twitter: '',
            youtube: '',
            tiktok: '',
            linkedin: '',
            website: '',
        }
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
                    const storefrontData = data.storefrontData || {};
                    setFormData(prev => ({
                        ...prev,
                        displayName: profileData.displayName || user.fullName || '',
                        username: profileData.username || user.username || '',
                        bio: profileData.bio || '',
                        email: profileData.email || user.primaryEmailAddress?.emailAddress || '',
                        socialLinks: {
                            instagram: storefrontData.socialLinks?.instagram || '',
                            twitter: storefrontData.socialLinks?.twitter || '',
                            youtube: storefrontData.socialLinks?.youtube || '',
                            tiktok: storefrontData.socialLinks?.tiktok || '',
                            linkedin: storefrontData.socialLinks?.linkedin || '',
                            website: storefrontData.socialLinks?.website || '',
                        }
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
            // 1. Get Presigned URL
            const presignedRes = await fetch('/api/upload/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    type: 'avatar'
                })
            });

            if (!presignedRes.ok) throw new Error('Failed to initialize upload protocol');
            const { uploadUrl, publicUrl } = await presignedRes.json();

            // 2. Upload to S3
            const s3Res = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            if (!s3Res.ok) throw new Error('S3 Uplink failed');

            // 3. Update Profile in DB
            const updateRes = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: publicUrl }),
            });

            if (!updateRes.ok) throw new Error('Failed to synchronize identity');

            setAvatarUrl(publicUrl);
            toast.success('Visual artifact updated.');
            if (user?.reload) await user.reload();
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || 'Identity upload failed.');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure you want to remove your profile photo?')) return;

        setIsUploadingAvatar(true);
        try {
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: '' }),
            });

            if (!res.ok) throw new Error('Failed to remove avatar');

            setAvatarUrl('');
            toast.success('Identity artifact removed.');
            if (user?.reload) await user.reload();
        } catch (err: any) {
            toast.error('Removal failed.');
        } finally {
            setIsUploadingAvatar(false);
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
                {/* Column 1: Identity Card */}
                <div className="space-y-8 h-fit">
                    <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 flex flex-col items-center text-center group shadow-2xl shadow-indigo-500/5">
                        <div className="relative mb-8 pt-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 border-4 border-white/10 overflow-hidden shadow-2xl relative group/avatar">
                                {isUploadingAvatar ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <Image
                                            src={avatarUrl || user?.imageUrl || '/avatar-placeholder.png'}
                                            alt="Identity"
                                            fill
                                            sizes="160px"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2 absolute bottom-2 right-2">
                                <Button
                                    size="icon"
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 bg-white text-black rounded-full border-2 border-black hover:bg-zinc-200 shadow-xl transition-all hover:scale-110"
                                >
                                    <Camera size={16} />
                                </Button>
                                {avatarUrl && (
                                    <Button
                                        size="icon"
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="w-10 h-10 bg-red-500 text-white rounded-full border-2 border-black hover:bg-red-600 shadow-xl transition-all hover:scale-110"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">
                            {formData.displayName || user?.fullName}
                        </h2>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 italic">
                            @{formData.username}
                        </p>

                        <div className="flex gap-3">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                                <Sparkles className="w-3 h-3 mr-2" /> PRO CREATOR
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-zinc-900/20 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic mb-4">PUBLIC NARRATIVE</h3>
                            <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">
                                {formData.bio || "No narrative initialized yet..."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Column 2: Core Configuration */}
                <div className="space-y-8">
                    <form onSubmit={handleSave} className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">IDENTITY ARTIFACTS</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">Display Alias</label>
                                <Input
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="bg-black/40 border-white/5 rounded-2xl h-14 px-6 text-white font-black italic focus:border-indigo-500/50"
                                    placeholder="PUBLIC ALIAS"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">System Narrative (Bio)</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={4}
                                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] px-8 py-6 text-white font-bold italic focus:border-indigo-500/50 focus:outline-none transition-all resize-none placeholder:text-zinc-800"
                                    placeholder="INITIALIZE YOUR NARRATIVE..."
                                />
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">SOCIAL INTEGRATIONS</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative">
                                        <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            value={formData.socialLinks.instagram}
                                            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                            className="bg-black/20 border-white/5 rounded-xl h-12 pl-14 text-xs font-bold"
                                            placeholder="Instagram Username"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Twitter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            value={formData.socialLinks.twitter}
                                            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                                            className="bg-black/20 border-white/5 rounded-xl h-12 pl-14 text-xs font-bold"
                                            placeholder="Twitter Username"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            value={formData.socialLinks.youtube}
                                            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                                            className="bg-black/20 border-white/5 rounded-xl h-12 pl-14 text-xs font-bold"
                                            placeholder="Youtube Channel URL"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            value={formData.socialLinks.website}
                                            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
                                            className="bg-black/20 border-white/5 rounded-xl h-12 pl-14 text-xs font-bold"
                                            placeholder="Personal Website URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="h-14 px-10 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl hover:scale-105 transition-all"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3" />}
                                SYNC IDENTITY
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Column 3: Telemetry & QR */}
                <div className="space-y-8 h-fit">
                    <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 italic">SYSTEM TELEMETRY</h3>
                            <div className="space-y-5">
                                {[
                                    { label: 'Access Level', val: 'PRO TIER' },
                                    { label: 'Genesis', val: joinedDate.toUpperCase() },
                                    { label: 'Uptime', val: '99.9%', color: 'text-emerald-400' },
                                    { label: 'Infrastructure', val: 'AWS-S3-MDB' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs font-black italic">
                                        <span className="text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                                        <span className={cn("text-white", stat.color)}>{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center group hover:rotate-1 transition-transform">
                                <QRCodeSVG
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/u/${formData.username}` : ''}
                                    size={140}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                                    Project Identity QR
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/u/${formData.username}`, '_blank')}
                                    className="w-full border-white/10 text-white rounded-2xl h-12 uppercase text-[9px] font-black tracking-widest italic hover:bg-white/5"
                                >
                                    OPEN STOREFRONT <ExternalLink size={12} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/20 blur-[50px] group-hover:bg-indigo-500/40 transition-all" />
                        <h4 className="text-sm font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                            <LayoutDashboard className="w-5 h-5 text-indigo-400" /> ADVANCED DESIGN
                        </h4>
                        <p className="text-xs text-zinc-400 font-medium italic">
                            Elevate your storefront architecture with the advanced editor.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard/storefront')}
                            className="w-full bg-indigo-500 text-white h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                        >
                            LAUNCH EDITOR
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
