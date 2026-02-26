'use client';

import React, { useState } from 'react';
import {
    Clock, Globe, Plus, Trash2, Copy, Save, Check,
    AlertCircle, Calendar, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' },
];

export default function AvailabilityPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+05:30)');
    const [schedule, setSchedule] = useState<any>({
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [],
        sunday: []
    });

    const addSlot = (day: string) => {
        setSchedule({
            ...schedule,
            [day]: [...schedule[day], { start: '09:00', end: '17:00' }]
        });
    };

    const removeSlot = (day: string, index: number) => {
        setSchedule({
            ...schedule,
            [day]: schedule[day].filter((_: any, i: number) => i !== index)
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Availability</h1>
                    <p className="text-zinc-500">Set your default working hours and block off time.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg"
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Schedule
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                Weekly Hours
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            {DAYS.map((day) => (
                                <div key={day.id} className="flex flex-col sm:flex-row sm:items-start gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="w-28 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${schedule[day.id].length > 0 ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'
                                                }`}>
                                                {schedule[day.id].length > 0 && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                            </div>
                                            <span className={`text-sm font-bold ${schedule[day.id].length > 0 ? 'text-white' : 'text-zinc-600'}`}>{day.name}</span>
                                        </label>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {schedule[day.id].length > 0 ? (
                                            <>
                                                {schedule[day.id].map((slot: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                                                        <input
                                                            type="time"
                                                            value={slot.start}
                                                            className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                        />
                                                        <span className="text-zinc-600">—</span>
                                                        <input
                                                            type="time"
                                                            value={slot.end}
                                                            className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removeSlot(day.id, idx)}
                                                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addSlot(day.id)}
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-2"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add time slot
                                                </button>
                                            </>
                                        ) : (
                                            <p className="pt-2 text-sm text-zinc-600 italic">Unavailable</p>
                                        )}
                                    </div>

                                    {schedule[day.id].length > 0 && (
                                        <button className="p-2 text-zinc-600 hover:text-white transition-colors flex-shrink-0">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Timezone Card */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            Timezone
                        </h4>
                        <select
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-400 focus:border-indigo-500 outline-none"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            <option>Asia/Kolkata (GMT+05:30)</option>
                            <option>UTC (GMT+00:00)</option>
                            <option>America/New_York (GMT-05:00)</option>
                        </select>
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                            All your bookings will be automatically converted to the visitor&apos;s local timezone.
                        </p>
                    </div>

                    {/* Date Overrides Card */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-400" />
                                Date Overrides
                            </h4>
                        </div>
                        <p className="text-xs text-zinc-500">Block specific dates for holidays or set custom hours.</p>

                        <div className="space-y-3">
                            <div className="p-4 bg-black rounded-2xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-white">Mar 15, 2026</p>
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-0.5">Blocked</p>
                                </div>
                                <button className="text-zinc-600 hover:text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        <button className="w-full py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition-all">
                            Add Date Override
                        </button>
                    </div>

                    {/* Calendar Sync */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-indigo-400" />
                            Calendar Sync
                        </h4>
                        <p className="text-xs text-zinc-500">Connect external calendars to prevent double booking.</p>

                        <div className="space-y-3">
                            <button className="w-full p-4 bg-black rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/5 transition-all text-left">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-white">Google Calendar</p>
                                    <p className="text-[10px] text-zinc-600">Sync busy times</p>
                                </div>
                                <div className="text-[10px] font-bold text-indigo-400">Connect</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
