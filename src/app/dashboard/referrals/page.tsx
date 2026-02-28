'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Copy, Share2, MousePointer2, Users, Trophy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralData {
    code: string;
    clicks: number;
    conversions: number;
    link: string;
}

export default function ReferralsPage() {
    const { isLoaded, isSignedIn } = useUser();
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        const fetchReferral = async () => {
            try {
                const res = await fetch('/api/user/referral');
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error('Failed to fetch referral data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReferral();
    }, [isLoaded, isSignedIn]);

    const copyToClipboard = () => {
        if (data?.link) {
            navigator.clipboard.writeText(data.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const share = async () => {
        if (navigator.share && data?.link) {
            try {
                await navigator.share({
                    title: 'Join AutoDM Hub',
                    text: 'Check out AutoDM Hub and start automating your lead capture!',
                    url: data.link,
                });
            } catch (err) {
                console.log('Share cancelled', err);
            }
        } else {
            copyToClipboard();
        }
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tight"
                    >
                        Refer & <span className="text-indigo-500">Earn</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-500 font-medium"
                    >
                        Invite others to AutoDM Hub and track your influence.
                    </motion.p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Referral Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-2 bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                            <div className="space-y-4">
                                <h2 className="text-xl font-black">Your Unique Link</h2>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-mono text-sm text-indigo-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {data?.link}
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex-1 sm:flex-none bg-white text-black p-4 rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={share}
                                            className="flex-1 sm:flex-none bg-indigo-500 text-white p-4 rounded-2xl hover:bg-indigo-400 active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {copied && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-emerald-400 text-xs font-bold"
                                        >
                                            Link copied to clipboard!
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Reward Progress */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Progress to Reward</p>
                                        <p className="text-lg font-black">
                                            {5 - ((data?.conversions || 0) % 5)} <span className="text-zinc-500">more conversions left</span>
                                        </p>
                                    </div>
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(((data?.conversions || 0) % 5) * 20, 100)}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats */}
                        <div className="flex flex-col gap-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 space-y-4 flex-1 flex flex-col justify-center"
                            >
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2">
                                    <MousePointer2 className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black">{data?.clicks || 0}</p>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Total Clicks</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 space-y-4 flex-1 flex flex-col justify-center"
                            >
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-2">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black">{data?.conversions || 0}</p>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Conversions</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-indigo-500 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-black">How it works?</h3>
                        <p className="text-white/80 font-medium max-w-sm">
                            Each conversion brings you closer to exclusive rewards and platform perks.
                        </p>
                    </div>
                    <button className="bg-white text-indigo-500 font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-zinc-100 transition-all active:scale-95">
                        Learn More
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
