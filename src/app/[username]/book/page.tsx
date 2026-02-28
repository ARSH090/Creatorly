/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
import React from 'react';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { BookingService } from '@/lib/models/BookingService';
import { CalendarDays, Clock, IndianRupee, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getCreatorData(username: string) {
    await connectToDatabase();
    const creator = await User.findOne({ username }).select('displayName username bio avatar');
    if (!creator) return null;

    const services = await BookingService.find({
        creatorId: creator._id,
        isActive: true
    }).sort({ sortOrder: 1 });

    return { creator, services };
}

export default async function PublicBookingPage({ params }: { params: { username: string } }) {
    const data = await getCreatorData(params.username);
    if (!data) notFound();

    const { creator, services } = data;

    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-40">
                {/* Profile Header */}
                <div className="text-center mb-16">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 mx-auto mb-6 shadow-2xl shadow-indigo-500/20">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden border-4 border-black">
                            {creator.avatar ? (
                                <img src={creator.avatar} alt={creator.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                                    {creator.displayName?.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-black mb-2">{creator.displayName}</h1>
                    <p className="text-zinc-500 max-w-md mx-auto line-clamp-2 text-sm">
                        {creator.bio || 'Book a professional session for consulting, coaching, or creative reviews.'}
                    </p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 text-center">Select a Service</h2>

                    {services.map((service, i) => (
                        <Link
                            key={service._id}
                            href={`/${creator.username}/book/${service.bookingSlug}`}
                            className="group block bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-indigo-500/30 rounded-[2rem] p-8 transition-all hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {service.name}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-zinc-500 line-clamp-2">
                                        {service.description || 'Dedicated one-on-one session to discuss your objectives and provide expert guidance.'}
                                    </p>

                                    <div className="flex items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                            <Clock className="w-4 h-4 text-indigo-500/50" />
                                            {service.duration} Mins
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                                            <IndianRupee className="w-4 h-4 text-emerald-500" />
                                            {service.price === 0 ? 'Free' : `₹${service.price.toLocaleString('en-IN')}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white transition-all group-hover:bg-indigo-500/20">
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {services.length === 0 && (
                        <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
                            <p className="text-zinc-500 text-sm italic">No services available for booking yet.</p>
                        </div>
                    )}
                </div>

                {/* Footer branding */}
                <div className="mt-20 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white transition-all">
                        <span className="text-xs font-bold uppercase tracking-widest">Powered by</span>
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                            <span className="text-sm font-black text-white">Creatorly</span>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
