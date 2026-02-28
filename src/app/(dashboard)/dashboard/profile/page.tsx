'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { User, Mail, Shield, Save, Camera, Loader2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ProfilePage() {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [message, setMessage] = useState({ type: '', text: '' });
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

            // Fetch extended profile data from correct endpoint
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
                .catch(err => console.error('Failed to fetch profile', err));
        }
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Only JPG, PNG, WebP, or GIF images are allowed.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be smaller than 5 MB.' });
            return;
        }

        setIsUploadingAvatar(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Get a presigned S3 upload URL (correct endpoint)
            const presignRes = await fetch('/api/creator/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    fileSize: file.size,
                }),
            });
            if (!presignRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, publicUrl } = await presignRes.json();

            // 2. Upload directly to S3
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!uploadRes.ok) throw new Error('Upload to storage failed');

            // 3. Persist the new avatar URL (correct endpoint)
            const updateRes = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: publicUrl }),
            });
            if (!updateRes.ok) throw new Error('Failed to save avatar URL');

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Avatar updated!' });
            if (user?.reload) await user.reload();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Avatar upload failed.' });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                if (user?.reload) await user.reload();
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = () => {
        // Redirect to Clerk user profile security tab
        window.location.href = '/user-profile/security';
    };

    const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
    }) : 'Feb 2024';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">My Profile</h1>
                    <p className="text-zinc-500">Manage your personal information and public profile.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar & Quick Info */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center">
                        <div className="relative group mb-4">
                            {/* Hidden file input for avatar upload */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white/10 overflow-hidden">
                                {isUploadingAvatar ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black/50">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                ) : avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-black">
                                        {(formData.displayName || user?.firstName || 'C').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={isUploadingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full border-2 border-[#030303] text-white hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{formData.displayName || user?.fullName}</h2>
                        <p className="text-zinc-500 text-sm mb-4">@{formData.username || user?.username || 'creator'}</p>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
                                Pro Creator
                            </span>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-4">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 text-sm">Account Type</span>
                                <span className="text-white text-sm font-medium">Creator</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 text-sm">Joined</span>
                                <span className="text-white text-sm font-medium">{joinedDate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 text-sm">Email Verified</span>
                                <span className="text-emerald-400 text-sm font-medium">Yes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <User className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full bg-black/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-zinc-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Saving...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {message.text}
                            </div>
                        )}
                    </form>

                    {/* Security Section */}
                    <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Shield className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Security & Password</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-black rounded-2xl border border-white/5">
                            <div>
                                <p className="text-white font-bold mb-1">Update Password</p>
                                <p className="text-xs text-zinc-500">Manage security settings via Clerk</p>
                            </div>
                            <button
                                onClick={handlePasswordChange}
                                className="w-full sm:w-auto px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors">
                                Manage Security
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Profile QR Code</h3>
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl border border-white/10">
                        <QRCodeSVG
                            value={typeof window !== 'undefined' ? `${window.location.origin}/u/${formData.username || user?.username || 'creator'}` : ''}
                            size={200}
                            level="H"
                            includeMargin={true}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-zinc-400">Scan to open your public profile</p>
                        <a
                            href={`/u/${formData.username || user?.username || 'creator'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-indigo-500 rounded-xl text-white text-sm font-bold hover:bg-indigo-600"
                        >
                            Open Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
