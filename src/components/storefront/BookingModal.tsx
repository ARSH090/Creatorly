'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    creator: any;
    onSelectSlot: (slot: { date: Date; time: string }) => void;
}

export default function BookingModal({ isOpen, onClose, product, creator, onSelectSlot }: BookingModalProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    useEffect(() => {
        if (selectedDate) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate]);

    const fetchSlots = async (date: Date) => {
        setLoadingSlots(true);
        setSelectedTime(null);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await fetch(`/api/availability/${creator.username}/slots?date=${dateStr}&productId=${product.id}`);
            const data = await res.json();
            setSlots(data.slots || []);
        } catch (err) {
            console.error('Failed to fetch slots', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onSelectSlot({ date: selectedDate, time: selectedTime });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border border-white/10 text-white rounded-[2rem] p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row h-[550px]">
                    {/* Left: Product Info & Calendar */}
                    <div className="w-full md:w-2/3 p-8 border-r border-white/5 space-y-6 overflow-y-auto">
                        <div className="space-y-2">
                            <h2 className="font-black text-xl uppercase tracking-tighter italic">Schedule Session</h2>
                            <p className="text-zinc-500 text-sm font-medium">{product.name} • {product.coachingDuration || 30} mins</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-xs uppercase tracking-widest text-zinc-400">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-white/5 rounded-xl">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-xl">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <div key={d} className="text-[10px] font-black text-zinc-600 mb-2">{d}</div>
                                ))}
                                {days.map(day => {
                                    const isPast = isBefore(day, startOfDay(new Date()));
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                                    return (
                                        <button
                                            key={day.toString()}
                                            disabled={isPast}
                                            onClick={() => setSelectedDate(day)}
                                            className={`h-10 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-indigo-500 text-white' :
                                                    isPast ? 'text-zinc-800 cursor-not-allowed' : 'hover:bg-white/5 text-zinc-400'
                                                }`}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Slots Selection */}
                    <div className="w-full md:w-1/3 bg-white/[0.02] p-8 flex flex-col space-y-6">
                        {selectedDate ? (
                            <>
                                <div className="space-y-1">
                                    <span className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Available Slots</span>
                                    <h3 className="font-black text-xs uppercase tracking-widest">{format(selectedDate, 'EEE, MMM d')}</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
                                        </div>
                                    ) : slots.length > 0 ? (
                                        slots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedTime(slot)}
                                                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all border ${selectedTime === slot ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-black border-white/5 text-zinc-400 hover:border-white/10'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase tracking-widest">No slots available</p>
                                    )}
                                </div>

                                <button
                                    disabled={!selectedTime}
                                    onClick={handleConfirm}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-2xl shadow-white/5"
                                >
                                    Confirm Time
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                <CalendarIcon size={32} className="text-zinc-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select a date to view slots</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
