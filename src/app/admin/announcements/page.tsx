'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Megaphone,
    Plus,
    Trash2,
    Zap,
    Calendar,
    X,
    Radio,
    Terminal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        isActive: true,
        type: 'info'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/announcements');
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.announcements || []);
            }
        } catch (error) {
            toast.error('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements';
        const method = editingId ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success(editingId ? 'Broadcast updated' : 'Broadcast deployed');
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', message: '', isActive: true, type: 'info' });
                fetchAnnouncements();
            }
        } catch (error) {
            toast.error('Strategic deployment failed');
        }
    };

    const deleteAnnouncement = async (id: string) => {
        if (!confirm('Terminate this broadcast?')) return;
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Broadcast terminated');
                fetchAnnouncements();
            }
        } catch (error) {
            toast.error('Termination failed');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Megaphone className="w-10 h-10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                        BROADCAST CENTER
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Platform-wide Notifications • System Alerts
                    </p>
                </div>
                <Button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', message: '', isActive: true, type: 'info' }); }}
                    className="bg-zinc-900 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-black uppercase text-xs h-14 px-8 rounded-2xl transition-all"
                >
                    <Plus size={16} className="mr-2" /> NEW SIGNAL
                </Button>
            </header>

            {showForm && (
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                            <Terminal className="w-6 h-6 text-indigo-500" />
                            {editingId ? 'EDIT SIGNAL PROTOCOL' : 'NEW SIGNAL PROTOCOL'}
                        </h2>
                        <Button variant="ghost" onClick={() => setShowForm(false)} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </Button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Signal Title</Label>
                                <Input
                                    placeholder="ENTER BROADCAST HEADING..."
                                    className="bg-black/40 border-white/5 h-14 rounded-2xl text-white font-black uppercase text-xs tracking-widest focus:ring-indigo-500/20 placeholder:text-zinc-800"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Signal Type</Label>
                                <select
                                    className="w-full bg-black/40 border-white/5 h-14 rounded-2xl text-white font-black uppercase text-xs tracking-widest px-4 focus:ring-indigo-500/20 outline-none appearance-none"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <SelectItem value="info">Information</SelectItem>
                                    <SelectItem value="warning">Warning Alert</SelectItem>
                                    <SelectItem value="success">Success Signal</SelectItem>
                                    <SelectItem value="error">Critical Failure</SelectItem>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Broadcast Content</Label>
                            <Textarea
                                placeholder="ENCODE STRATEGIC MESSAGE..."
                                className="bg-black/40 border-white/5 rounded-2xl min-h-[160px] text-zinc-300 font-bold leading-relaxed focus:ring-indigo-500/20 placeholder:text-zinc-800 p-6"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <Label className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">Active Signal Status</Label>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                                {editingId ? 'Update Signal' : 'Deploy Broadast'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 space-y-4">
                            <Skeleton className="h-8 w-1/3 rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-24 rounded-full" />
                                <Skeleton className="h-4 w-24 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : announcements.length === 0 ? (
                    <EmptyState
                        icon={Radio}
                        title="No Active Broadcasts"
                        description="The signal archive is currently void. Create a new signal to broadcast across the platform."
                        actionLabel="Initialize System"
                        onAction={() => setShowForm(true)}
                    />
                ) : (
                    announcements.map((item) => (
                        <div key={item._id} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 group transition-all hover:bg-white/[0.02] relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40 opacity-0 group-hover:opacity-100 transition-all" />
                            <div className="flex justify-between items-start">
                                <div className="space-y-4 max-w-3xl">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{item.title}</h3>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                            item.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
                                        )}>
                                            {item.isActive ? 'Signal Live' : 'Encryption Dark'}
                                        </span>
                                    </div>
                                    <p className="text-zinc-400 font-medium leading-relaxed text-lg">{item.message}</p>
                                    <div className="flex items-center gap-6 pt-6 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                        <span className="flex items-center gap-2"><Calendar size={12} className="text-zinc-400" /> {format(new Date(item.createdAt), 'MMM dd, yyyy')}</span>
                                        <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full"><Zap size={12} className="text-amber-500" /> Protocol: {item.type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(item._id); setFormData({ ...item }); setShowForm(true); }} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                                        <Plus size={18} className="rotate-45" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteAnnouncement(item._id)} className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
