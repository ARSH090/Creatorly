'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Edit3, Trash2, Mail, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
    _id: string;
    userId?: {
        displayName: string;
        email: string;
        avatar?: string;
    };
    invitedEmail?: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    status: 'active' | 'pending' | 'suspended';
}

export const TeamDashboard = ({ teamId }: { teamId: string }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/teams/${teamId}/members`);
            const data = await res.json();
            if (Array.isArray(data)) setMembers(data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [teamId]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            await fetch(`/api/teams/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, email: newEmail, role: newRole })
            });
            setNewEmail('');
            setInviting(false);
            fetchMembers();
        } catch (err) {
            console.error('Invite failed:', err);
            setInviting(false);
        }
    };

    if (loading) return <div className="p-8 text-zinc-500">Loading members...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Team Workspace</h2>
                    <p className="text-zinc-400">Manage your collaborators and their access levels.</p>
                </div>
                <Users className="w-10 h-10 text-indigo-500/20" />
            </div>

            {/* Invite Form */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <form onSubmit={handleInvite} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="email"
                            required
                            placeholder="colleague@company.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <select
                        value={newRole}
                        onChange={(e: any) => setNewRole(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-4 text-white focus:outline-none"
                    >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <button
                        disabled={inviting}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        {inviting ? 'Inviting...' : 'Invite Member'}
                    </button>
                </form>
            </div>

            {/* Members List */}
            <div className="grid gap-4">
                {members.map((member) => (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={member._id}
                        className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-indigo-400 font-bold">
                                    {(member.userId?.displayName || member.invitedEmail || '?')[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-white leading-none mb-1">
                                    {member.userId?.displayName || 'Pending Invite'}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {member.userId?.email || member.invitedEmail}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {member.status}
                                </span>
                                <p className="text-xs text-zinc-600 mt-1 capitalize flex items-center gap-1 justify-end">
                                    <Shield className="w-3 h-3" />
                                    {member.role}
                                </p>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                {member.role !== 'owner' && (
                                    <button className="p-2 text-zinc-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
