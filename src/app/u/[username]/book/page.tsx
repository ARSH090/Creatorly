'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isToday, isPast, isSameMonth
} from 'date-fns';

declare const Razorpay: any;

export default function BookPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const [creatorInfo, setCreatorInfo] = useState<any>(null);
    const [availability, setAvailability] = useState<any>(null);

    // Fetch creator info
    useEffect(() => {
        fetch(`/api/availability/${username}`)
            .then(r => r.json())
            .then(d => {
                setCreatorInfo(d.creator);
                setAvailability(d.availability);
            })
            .catch(() => { });
    }, [username]);

    useEffect(() => {
        if (!selectedDate) return;
        setLoadingSlots(true);
        setSelectedSlot(null);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        fetch(`/api/availability/${username}/slots?date=${dateStr}`)
            .then(r => r.json())
            .then(d => setSlots(d.slots || []))
            .finally(() => setLoadingSlots(false));
    }, [selectedDate, username]);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const handleBook = async () => {
        if (!selectedDate || !selectedSlot || !name || !email) return;
        setBooking(true);

        const [h, m] = selectedSlot.split(':').map(Number);
        const startTime = new Date(selectedDate);
        startTime.setHours(h, m, 0, 0);
        const duration = availability?.defaultSlotDuration || 30;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        try {
            const res = await fetch('/api/bookings/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: creatorInfo?._id,
                    productId: null,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    customerName: name,
                    customerEmail: email,
                    notes
                })
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Failed to book. Please try again.');
                setBooking(false);
                return;
            }

            if (data.confirmed) {
                setConfirmed(true);
                setBooking(false);
                return;
            }

            // Paid session — open Razorpay
            const rzp = new Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                order_id: data.id,
                amount: data.amount,
                currency: data.currency,
                name: 'Creatorly Session',
                description: `1-on-1 session with @${username}`,
                prefill: { name, email },
                handler: () => {
                    setConfirmed(true);
                    setBooking(false);
                },
                modal: { ondismiss: () => setBooking(false) }
            });
            rzp.open();
        } catch (err) {
            console.error(err);
            setBooking(false);
        }
    };

    if (confirmed) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Booking Confirmed!</h1>
                    <p className="text-zinc-400 text-sm">
                        Your session with <strong className="text-white">@{username}</strong> on{' '}
                        <strong className="text-white">{selectedDate && format(selectedDate, 'PPP')}</strong> at{' '}
                        <strong className="text-white">{selectedSlot}</strong> is confirmed.
                        A confirmation email will be sent to <strong className="text-white">{email}</strong>.
                    </p>
                    <Link href={`/u/${username}`} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Razorpay SDK */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />

            <div className="max-w-5xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="mb-10">
                    <Link href={`/u/${username}`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to profile
                    </Link>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Book a Session
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">
                        with <span className="text-indigo-400 font-bold">@{username}</span>
                        {availability?.defaultSlotDuration && ` · ${availability.defaultSlotDuration} min`}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-zinc-400" />
                            </button>
                            <h2 className="font-black uppercase tracking-widest text-sm">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h2>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Day labels */}
                        <div className="grid grid-cols-7 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 py-2">{d}</div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Offset for month start */}
                            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {daysInMonth.map(day => {
                                const past = isPast(day) && !isToday(day);
                                const selected = selectedDate && isSameDay(day, selectedDate);
                                const today = isToday(day);
                                return (
                                    <button
                                        key={day.toISOString()}
                                        disabled={past}
                                        onClick={() => setSelectedDate(day)}
                                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                            ${past ? 'opacity-20 cursor-not-allowed text-zinc-600' : 'hover:bg-indigo-500/20 hover:text-indigo-300 cursor-pointer'}
                                            ${selected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : ''}
                                            ${today && !selected ? 'border border-indigo-500/50 text-indigo-400' : ''}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right panel: Slots + Form */}
                    <div className="space-y-6">
                        {/* Time slots */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                <h3 className="font-black uppercase text-xs tracking-widest text-zinc-300">
                                    {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
                                </h3>
                            </div>

                            {!selectedDate ? (
                                <p className="text-zinc-600 text-xs font-medium text-center py-6">
                                    Pick a date to see available slots
                                </p>
                            ) : loadingSlots ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-zinc-600 text-xs font-medium text-center py-6">
                                    No slots available on this day
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {slots.map(slot => (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border
                                                ${selectedSlot === slot
                                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                    : 'border-white/10 text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Booking form */}
                        {selectedSlot && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                                <h3 className="font-black uppercase text-xs tracking-widest text-zinc-300">Your Details</h3>
                                <input
                                    required
                                    placeholder="Your name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    required
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <textarea
                                    rows={3}
                                    placeholder="What do you want to discuss? (optional)"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                />
                                <button
                                    onClick={handleBook}
                                    disabled={booking || !name || !email}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                                >
                                    {booking ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : (
                                        <><Calendar className="w-4 h-4" /> Confirm Booking</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
