'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Plus, Trash2, Save, ExternalLink } from 'lucide-react';

const DAYS = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
];

export default function AvailabilityPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState<any>(null);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const res = await fetch('/api/availability');
            const data = await res.json();
            if (data.availability) {
                setAvailability(data.availability);
            }
        } catch (err) {
            console.error('Failed to fetch availability');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/availability', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability })
            });
        } catch (err) {
            console.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (dayId: number) => {
        setAvailability((prev: any) => ({
            ...prev,
            weeklySchedule: prev.weeklySchedule.map((d: any) =>
                d.dayOfWeek === dayId ? { ...d, active: !d.active } : d
            )
        }));
    };

    const addSlot = (dayId: number) => {
        setAvailability((prev: any) => ({
            ...prev,
            weeklySchedule: prev.weeklySchedule.map((d: any) =>
                d.dayOfWeek === dayId ? { ...d, slots: [...d.slots, { start: '09:00', end: '17:00' }] } : d
            )
        }));
    };

    const removeSlot = (dayId: number, index: number) => {
        setAvailability((prev: any) => ({
            ...prev,
            weeklySchedule: prev.weeklySchedule.map((d: any) =>
                d.dayOfWeek === dayId ? { ...d, slots: d.slots.filter((_: any, i: number) => i !== index) } : d
            )
        }));
    };

    if (loading) return <div className="p-8 text-zinc-500">Loading schedule...</div>;

    return (
        <div className="max-w-4xl p-8 space-y-12">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Schedule & Availability</h1>
                <p className="text-zinc-500 mt-2">Set your working hours and buffer times for 1:1 sessions.</p>
            </div>

            {/* Global Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400">
                        <Clock size={20} />
                        <h3 className="font-bold uppercase text-xs tracking-widest">Meeting Settings</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-black text-zinc-500">Default Slot Duration (mins)</label>
                            <input
                                type="number"
                                value={availability.defaultSlotDuration}
                                onChange={(e) => setAvailability({ ...availability, defaultSlotDuration: Number(e.target.value) })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-zinc-500">Buffer Between Meetings (mins)</label>
                            <input
                                type="number"
                                value={availability.bufferTime}
                                onChange={(e) => setAvailability({ ...availability, bufferTime: Number(e.target.value) })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-red-400">
                        <Calendar size={20} />
                        <h3 className="font-bold uppercase text-xs tracking-widest">Integrations</h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs text-zinc-400">Sync your bookings with Google Calendar and automatically generate Google Meet links.</p>
                        <button
                            onClick={() => window.location.href = '/api/integrations/google/auth'}
                            className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            {availability.isGoogleCalendarSyncEnabled ? (
                                <><Save size={14} /> Reconnect Google</>
                            ) : (
                                <><Calendar size={14} /> Connect Google Calendar</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-widest text-sm italic">Weekly Hours</h3>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-500 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="space-y-3">
                    {DAYS.map((day) => {
                        const config = availability.weeklySchedule.find((d: any) => d.dayOfWeek === day.id);
                        return (
                            <div key={day.id} className={`p-6 rounded-3xl border transition-all ${config?.active ? 'bg-white/[0.03] border-white/10' : 'bg-black border-dashed border-white/5 opacity-50'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <input
                                            type="checkbox"
                                            checked={config?.active}
                                            onChange={() => toggleDay(day.id)}
                                            className="w-5 h-5 rounded-lg bg-black border-white/10 text-indigo-500 focus:ring-0"
                                        />
                                        <span className="font-black uppercase tracking-tighter text-lg italic">{day.name}</span>
                                    </div>

                                    {config?.active ? (
                                        <div className="flex-1 space-y-2">
                                            {config.slots.map((slot: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) => {
                                                            const newSlots = [...config.slots];
                                                            newSlots[idx].start = e.target.value;
                                                            setAvailability((prev: any) => ({
                                                                ...prev,
                                                                weeklySchedule: prev.weeklySchedule.map((d: any) => d.dayOfWeek === day.id ? { ...d, slots: newSlots } : d)
                                                            }));
                                                        }}
                                                        className="bg-black border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-zinc-500">-</span>
                                                    <input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) => {
                                                            const newSlots = [...config.slots];
                                                            newSlots[idx].end = e.target.value;
                                                            setAvailability((prev: any) => ({
                                                                ...prev,
                                                                weeklySchedule: prev.weeklySchedule.map((d: any) => d.dayOfWeek === day.id ? { ...d, slots: newSlots } : d)
                                                            }));
                                                        }}
                                                        className="bg-black border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <button onClick={() => removeSlot(day.id, idx)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addSlot(day.id)}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors mt-2"
                                            >
                                                <Plus size={12} /> Add Time Slot
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">Unavailable</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
