'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    ChevronLeft, ChevronRight, Plus, Filter,
    Video, Users, IndianRupee, Clock, ExternalLink, Calendar
} from 'lucide-react';

const locales = {
    'en-IN': enIN,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// Mock events
const events = [
    {
        id: 1,
        title: 'Strategy Call - Rahul Sharma',
        start: new Date(2026, 2, 5, 15, 0),
        end: new Date(2026, 2, 5, 16, 0),
        resource: { service: '1:1 Call', price: 2000, color: '#6366f1' }
    },
    {
        id: 2,
        title: 'Portfolio Review - Priya Patel',
        start: new Date(2026, 2, 6, 11, 30),
        end: new Date(2026, 2, 6, 12, 0),
        resource: { service: 'Review', price: 1500, color: '#ec4899' }
    }
];

export default function SchedulifyCalendar() {
    const [view, setView] = useState<any>(Views.WEEK);
    const [date, setDate] = useState(new Date(2026, 2, 5));
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const eventStyleGetter = (event: any) => {
        return {
            style: {
                backgroundColor: event.resource?.color || '#3182ce',
                borderRadius: '8px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }
        };
    };

    return (
        <div className="space-y-8 pb-12 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Calendar</h1>
                    <p className="text-zinc-500">Manage your schedule and upcoming sessions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-zinc-900 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-800 transition-all">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all">
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 flex flex-col overflow-hidden">
                {/* Custom Toolbar Info */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            {format(date, 'MMMM yyyy')}
                        </h2>
                        <div className="flex items-center gap-1 ml-4 bg-black rounded-xl p-1 border border-white/5">
                            <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() - 1)))} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-all rounded-lg">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => setDate(new Date())} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">Today</button>
                            <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() + 1)))} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-all rounded-lg">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center bg-black p-1 rounded-xl border border-white/5">
                        {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${view === v ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calendar Component */}
                <div className="flex-1 calendar-container">
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        onView={(v) => setView(v)}
                        date={date}
                        onNavigate={(d) => setDate(d)}
                        eventPropGetter={eventStyleGetter}
                        style={{ height: '100%' }}
                        popup
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        components={{
                            toolbar: () => null // Use our custom toolbar above
                        }}
                    />
                </div>
            </div>

            {/* Event Detail Modal (Simple Mock) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 pb-20">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setSelectedEvent(null)}
                    />
                    <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-lg p-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <Clock className="w-40 h-40" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                                    <Video className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{selectedEvent.title}</h3>
                                    <p className="text-indigo-400 font-bold text-sm tracking-wide">{selectedEvent.resource.service}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <Calendar className="w-5 h-5 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Date & Time</p>
                                        <p className="text-sm font-bold text-white">
                                            {format(selectedEvent.start, 'EEEE, MMM do')} · {format(selectedEvent.start, 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <IndianRupee className="w-5 h-5 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Revenue</p>
                                        <p className="text-sm font-bold text-emerald-400">₹{selectedEvent.resource.price}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Join Meeting
                                </button>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-6 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-bold text-xs uppercase transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .rbc-calendar {
                    background: transparent;
                    color: white;
                    font-family: inherit;
                }
                .rbc-header {
                    padding: 12px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #52525b;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.05) !important;
                }
                .rbc-month-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
                    border: none;
                }
                .rbc-day-bg + .rbc-day-bg {
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rbc-month-row + .rbc-month-row {
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rbc-today {
                    background: rgba(99, 102, 241, 0.05);
                }
                .rbc-off-range-bg {
                    background: rgba(255, 255, 255, 0.02);
                }
                .rbc-time-header-content {
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rbc-time-content {
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    min-height: 60px;
                }
                .rbc-time-slot {
                    border-top: none;
                }
                .rbc-day-slot .rbc-time-slot {
                    border-top: 1px solid rgba(255, 255, 255, 0.02);
                }
                .rbc-label {
                    color: #3f3f46;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 0 10px;
                }
                .rbc-event {
                    border: none;
                    background: #6366f1;
                }
                .rbc-agenda-view table.rbc-agenda-table {
                    border: none;
                }
                .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    color: white;
                    font-size: 0.875rem;
                }
                .rbc-agenda-date-cell {
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #6366f1;
                }
                .rbc-show-more {
                    background: rgba(255, 255, 255, 0.05);
                    color: #818cf8;
                    font-size: 0.7rem;
                    font-weight: bold;
                    border-radius: 4px;
                    padding: 2px 5px;
                }
            `}</style>
        </div>
    );
}
