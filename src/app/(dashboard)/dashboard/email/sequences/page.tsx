'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Zap, Users, CheckCircle2, MoreVertical, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function SequencesPage() {
    const [loading, setLoading] = useState(true);
    const [sequences, setSequences] = useState<any[]>([]);

    const fetchSequences = async () => {
        try {
            const res = await fetch('/api/creator/email/automations');
            const data = await res.json();
            if (res.ok) {
                setSequences(data.sequences || []);
            } else {
                toast.error(data.error || 'Failed to fetch sequences');
            }
        } catch (error) {
            console.error('Fetch sequences error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/creator/email/automations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (res.ok) {
                toast.success(`Sequence ${!currentStatus ? 'activated' : 'paused'}`);
                fetchSequences();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight italic uppercase">Automated Sequences</h1>
                        <p className="text-muted-foreground">Automate your follow-ups and nurture your audience.</p>
                    </div>
                    <Button className="bg-white text-black hover:bg-zinc-200">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Sequence
                    </Button>
                </div>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : sequences.length === 0 ? (
                        <Card className="border-dashed bg-transparent border-white/10">
                            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Zap className="h-12 w-12 text-muted-foreground opacity-50" />
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">No active sequences</h3>
                                    <p className="text-muted-foreground">Set up an automated welcome sequence or purchase follow-up.</p>
                                </div>
                                <Button variant="outline" className="border-white/10 hover:bg-white/5">
                                    Browse Templates
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        sequences.map((seq) => (
                            <Card key={seq._id} className="bg-[#0A0A0A] border-white/5 hover:border-indigo-500/50 transition-all group overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${seq.isActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{seq.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-zinc-950">
                                                            Trigger: {seq.triggerType}
                                                        </Badge>
                                                        <span className="text-xs text-zinc-500">•</span>
                                                        <span className="text-xs text-zinc-500">{seq.steps?.length || 0} Steps</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-8 pt-2">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                                                        <Users className="h-3.5 w-3.5" /> Enrollments
                                                    </div>
                                                    <div className="text-xl font-black">{seq.stats?.enrollments || 0}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                                                    </div>
                                                    <div className="text-xl font-black">{seq.stats?.completed || 0}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`border-white/5 text-xs font-bold uppercase tracking-widest ${seq.isActive ? 'hover:bg-rose-500/10 hover:text-rose-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                                                onClick={() => toggleStatus(seq._id, seq.isActive)}
                                            >
                                                {seq.isActive ? (
                                                    <><Pause className="mr-2 h-3 w-3" /> Pause</>
                                                ) : (
                                                    <><Play className="mr-2 h-3 w-3" /> Activate</>
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:bg-white/5">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Mini visual indicator of steps */}
                                    <div className="h-1 bg-zinc-900 w-full flex">
                                        {(seq.steps || []).map((_: any, i: number) => (
                                            <div key={i} className={`h-full flex-1 border-r border-black/50 ${seq.isActive ? 'bg-indigo-500/40' : 'bg-zinc-800'}`} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
