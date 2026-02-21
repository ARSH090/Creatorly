'use client';
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Info, Loader2, Mail, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

export default function TeamPage() {
    const { user } = useAuth();
    const { getToken } = useClerkAuth();
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);

    const fetchTeam = async () => {
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/team', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchTeam();
    }, [user]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/team', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail, role: 'member' })
            });

            const result = await res.json();

            if (res.ok) {
                toast.success('Invitation sent!');
                setInviteEmail('');
                setShowInviteModal(false);
                fetchTeam(); // Refresh list
            } else {
                toast.error(result.error || 'Failed to send invitation');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Team Core...</p>
            </div>
        );
    }

    const members = data?.memberships || [];
    const planLimit = data?.planLimit || 1;
    const isLimitReached = members.length >= planLimit;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Command Center</h1>
                    <p className="text-zinc-500 font-medium">Coordinate with your elite team of collaborators.</p>
                </div>
                {!isLimitReached && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-white text-black font-black py-4 px-8 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        Enlist Member
                    </button>
                )}
            </div>

            {/* Plan Alert */}
            {isLimitReached && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] p-8 flex items-start gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-white font-black uppercase italic tracking-tight mb-2">Collaboration Limit Reached</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
                            Your current protocol supports <span className="text-white font-bold">{planLimit}</span> team member.
                            Upgrade to <span className="text-white font-bold">Pro</span> or <span className="text-white font-bold">Elite</span> to unlock multi-user orchestration.
                        </p>
                        <button className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2">
                            View Upgrade Options <ShieldCheck size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Member List */}
            <div className="bg-zinc-900/50 rounded-[3rem] p-10 border border-white/5 space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-zinc-500" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Active Operatives</h3>
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        {members.length} / {planLimit} Units Active
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {members.map((member: any) => (
                        <div key={member._id} className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                                    {member.userId?.avatar ? (
                                        <img src={member.userId.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-6 h-6 text-zinc-600" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-white font-black text-sm uppercase italic tracking-tight">
                                            {member.userId?.displayName || member.userId?.username || 'Pending Invite'}
                                        </p>
                                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${member.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-tight">{member.invitedEmail || member.userId?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{member.role}</p>
                                    <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1">
                                        Joined {new Date(member.createdAt).toLocaleDateString()} <Clock size={8} />
                                    </p>
                                </div>
                                {member.role !== 'owner' && (
                                    <button className="p-3 text-zinc-600 hover:text-rose-400 transition-colors bg-white/5 rounded-xl border border-transparent hover:border-rose-400/20">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal Overlay */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-lg p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Enlist New operative</h2>
                            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Authorize access to your digital command center.</p>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Email Coordinates</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="agent@creatorly.in"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-8 py-5 border border-white/5 bg-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-[2] px-8 py-5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Send Mandate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
