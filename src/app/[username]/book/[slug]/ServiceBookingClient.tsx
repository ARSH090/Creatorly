'use client';

import React, { useState, useEffect } from 'react';
import {
    Clock, Globe, ChevronLeft, ChevronRight,
    Calendar as CalendarIcon, CheckCircle2,
    IndianRupee, ArrowRight, Loader2, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, addDays } from 'date-fns';

export default function ServiceBookingClient({ creator, service }: { creator: any; service: any }) {
    const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Confirmation
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });

    // Mock slots for now
    const slots = ['09:00', '10:00', '11:30', '14:00', '15:30', '16:00', '17:30'];

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingSlots(true);
        // Implement booking submission to /api/schedulify/book
        setTimeout(() => {
            setIsLoadingSlots(false);
            setStep(3);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 py-12 md:py-24 px-6 md:px-12">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 relative z-10">

                {/* Left: Service Info Sidebar */}
                <div className="lg:w-[400px] space-y-8">
                    <div className="sticky top-12">
                        <div className="flex items-center gap-4 mb-8">
                            <img src={creator.avatar} alt={creator.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-white/10" />
                            <div>
                                <p className="text-sm font-bold text-zinc-400">{creator.displayName}</p>
                                <h1 className="text-2xl font-black text-white">{service.name}</h1>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold">{service.duration} Minutes</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <MapPin className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold capitalize">{service.meetingType.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <IndianRupee className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-bold">{service.price === 0 ? 'Free' : `₹${service.price.toLocaleString('en-IN')}`}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Globe className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold">India Standard Time (IST)</span>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5">
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                {service.description || 'Professional session designed to help you achieve your goals with expert advice.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Interaction Area */}
                <div className="flex-1 bg-zinc-900/40 rounded-[3rem] border border-white/5 p-8 md:p-12 shadow-2xl backdrop-blur-xl min-h-[600px] flex flex-col relative overflow-hidden">

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col md:flex-row gap-12"
                            >
                                {/* Mini Calendar */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
                                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                            <span key={d} className="text-[10px] font-black uppercase text-zinc-600 tracking-widest py-2">{d}</span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {days.map((day, i) => {
                                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                                            const isPast = isBefore(day, startOfDay(new Date()));
                                            const isAvailable = !isPast && (getDay(day) !== 0 && getDay(day) !== 6); // Simple mock: no weekends

                                            // Handle grid start offset
                                            const style = i === 0 ? { gridColumnStart: getDay(day) + 1 } : {};

                                            return (
                                                <button
                                                    key={day.toString()}
                                                    style={style}
                                                    disabled={!isAvailable}
                                                    onClick={() => setSelectedDate(day)}
                                                    className={`aspect-square rounded-2xl flex items-center justify-center font-bold text-sm transition-all relative group ${isSelected
                                                            ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 z-10 scale-105'
                                                            : isAvailable
                                                                ? 'bg-zinc-800/10 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                                                                : 'text-zinc-700 pointer-events-none'
                                                        }`}
                                                >
                                                    {format(day, 'd')}
                                                    {isToday(day) && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slot Selection */}
                                <div className="w-full md:w-64 flex flex-col">
                                    <h3 className="text-lg font-black text-white mb-8">
                                        {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
                                    </h3>

                                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[400px]">
                                        {selectedDate ? (
                                            slots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`w-full py-4 px-6 rounded-2xl border font-black text-sm transition-all text-center ${selectedTime === time
                                                            ? 'bg-white text-black border-white shadow-xl shadow-white/5'
                                                            : 'bg-black border-white/10 text-zinc-400 hover:border-indigo-500/50 hover:text-white'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600 space-y-4 py-12">
                                                <CalendarIcon className="w-12 h-12 opacity-10" />
                                                <p className="text-sm font-bold italic">Pick a date to see times</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedDate && selectedTime && (
                                        <button
                                            onClick={() => setStep(2)}
                                            className="mt-8 bg-indigo-500 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                                        >
                                            Next Step
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 max-w-xl mx-auto w-full py-12"
                            >
                                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest mb-8 transition-colors">
                                    <ChevronLeft className="w-4 h-4" /> Go Back
                                </button>

                                <h3 className="text-3xl font-black text-white mb-2">Almost Done!</h3>
                                <p className="text-zinc-500 mb-10">Please provide your details to confirm the booking.</p>

                                <form onSubmit={handleBooking} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="What should I call you?"
                                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="Where should I send the link?"
                                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Pre-Call Notes (Optional)</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Tell me about what you want to discuss..."
                                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoadingSlots}
                                        className="w-full bg-indigo-500 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {isLoadingSlots ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Confirm Booking
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col items-center justify-center text-center py-20"
                            >
                                <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-3xl shadow-emerald-500/40 rotate-12">
                                    <CheckCircle2 className="w-12 h-12 text-white -rotate-12" strokeWidth={3} />
                                </div>
                                <h3 className="text-4xl font-black text-white mb-4">You&apos;re Booked!</h3>
                                <p className="text-zinc-500 max-w-sm mb-12 leading-relaxed">
                                    Confirmation details and meeting link have been sent to <span className="text-indigo-400 font-bold">{formData.email}</span>
                                </p>

                                <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 w-full max-w-md space-y-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Date</span>
                                        <span className="text-white font-black">{format(selectedDate!, 'MMMM do, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Time</span>
                                        <span className="text-white font-black">{selectedTime} IST</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Location</span>
                                        <span className="text-indigo-400 font-black">Google Meet Link Sent</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service.name)}&dates=...`, '_blank')}
                                    className="mt-12 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all underline underline-offset-8"
                                >
                                    Add to Calendar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function getDay(date: Date) {
    return date.getDay();
}
