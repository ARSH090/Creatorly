// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Layers, Edit2, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Edit Form
    const [form, setForm] = useState({
        monthlyPrice: '',
        yearlyPrice: '',
        displayFeatures: '',
        maxProducts: '5',
        transactionFeePercent: '3',
        hasAutoDM: false,
        isVisible: true
    });

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setForm({
            monthlyPrice: (plan.monthlyPrice / 100).toString(),
            yearlyPrice: (plan.yearlyPrice / 100).toString(),
            displayFeatures: (plan.displayFeatures || []).join(', '),
            maxProducts: (plan.trialLimits?.maxProducts || 5).toString(),
            transactionFeePercent: (plan.trialLimits?.transactionFeePercent || 3).toString(),
            hasAutoDM: !!plan.trialLimits?.hasAutoDM,
            isVisible: plan.isVisible !== false
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/plans/${editingPlan._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    monthlyPrice: parseFloat(form.monthlyPrice) * 100,
                    yearlyPrice: parseFloat(form.yearlyPrice) * 100,
                    displayFeatures: form.displayFeatures.split(',').map(s => s.trim()).filter(Boolean),
                    trialLimits: {
                        maxProducts: parseInt(form.maxProducts),
                        transactionFeePercent: parseFloat(form.transactionFeePercent),
                        hasAutoDM: form.hasAutoDM
                    },
                    isVisible: form.isVisible
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success(`${editingPlan.name} updated — new price applies to new signups only. Existing subscribers are grandfathered.`);
                setEditingPlan(null);
                fetchPlans();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update plan');
            }
        } catch (error) {
            toast.error('Error updating plan');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                        <Layers className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                        SUBSCRIPTION TIERS
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Revenue Architecture • Gateway Sync Active
                    </p>
                </div>
            </div>

            <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent px-8">
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Plan name</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tier Level</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Monthly (₹)</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Yearly (₹)</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Visibility</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</TableHead>
                            <TableHead className="px-10 py-8 text-right text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Control</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Querying Tiers</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <TableCell className="px-10 py-8 font-black text-white text-lg tracking-tight italic uppercase">
                                        {plan.name}
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black uppercase text-[9px] tracking-widest px-3 py-1">
                                            {plan.tier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-8 font-mono font-black text-white">
                                        ₹{plan.monthlyPrice / 100}
                                    </TableCell>
                                    <TableCell className="px-10 py-8 font-mono font-black text-white">
                                        ₹{plan.yearlyPrice / 100}
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <Badge variant={plan.isVisible ? 'default' : 'outline'} className={`uppercase text-[9px] font-black tracking-widest px-4 py-1.5 ${plan.isVisible ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-zinc-600 border-zinc-700'}`}>
                                            {plan.isVisible ? 'Visible UI' : 'Hidden UI'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <Badge variant={plan.isActive ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest px-4 py-1.5">
                                            {plan.isActive ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-8 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="bg-black/40 border border-white/5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 rounded-xl h-12 w-12 transition-all"
                                            onClick={() => handleEdit(plan)}
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                <DialogContent className="bg-zinc-900 border-white/10 rounded-[2.5rem] shadow-2xl p-10 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                            Configure Architecture: {editingPlan?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-8 pt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Monthly Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={form.monthlyPrice}
                                    onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                                    className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black tracking-widest focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Yearly Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={form.yearlyPrice}
                                    onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                                    className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black tracking-widest focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Display Features (comma separated)</Label>
                            <Input
                                value={form.displayFeatures}
                                onChange={(e) => setForm({ ...form, displayFeatures: e.target.value })}
                                placeholder="e.g. 5 products, 0% fees, AutoDM included"
                                className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black tracking-widest focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-6">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Trial Restrictions (Free/Trial State)</p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Max Products</Label>
                                    <Input
                                        type="number"
                                        value={form.maxProducts}
                                        onChange={(e) => setForm({ ...form, maxProducts: e.target.value })}
                                        className="bg-zinc-900 border-white/5 rounded-xl h-12 text-white font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Fee (%)</Label>
                                    <Input
                                        type="number"
                                        value={form.transactionFeePercent}
                                        onChange={(e) => setForm({ ...form, transactionFeePercent: e.target.value })}
                                        className="bg-zinc-900 border-white/5 rounded-xl h-12 text-white font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="hasAutoDM"
                                    checked={form.hasAutoDM}
                                    onChange={(e) => setForm({ ...form, hasAutoDM: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-zinc-900"
                                />
                                <Label htmlFor="hasAutoDM" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer">Enable AutoDM in Trial</Label>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    checked={form.isVisible}
                                    onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-zinc-900"
                                />
                                <Label htmlFor="isVisible" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer">Public Visibility (Show on Subscribe Page)</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Gateway Registry Identifiers</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase">Monthly ID</p>
                                        <p className="text-[10px] font-mono text-zinc-400 break-all">{editingPlan?.razorpayMonthlyPlanId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase">Yearly ID</p>
                                        <p className="text-[10px] font-mono text-zinc-400 break-all">{editingPlan?.razorpayYearlyPlanId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] text-amber-500/70 font-bold flex items-center gap-2 px-2">
                                <ShieldCheck className="w-3 h-3" />
                                Note: Price updates create new plan versions in Razorpay automatically.
                            </p>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={updating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-500/30">
                                {updating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-3 h-5 w-5" />}
                                RE-SYNC & COMMIT
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
