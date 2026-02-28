'use client';

import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StorefrontTheme } from '@/types/storefront.types';

interface Testimonial {
    id: string;
    name: string;
    role?: string;
    content: string;
    rating?: number;
    avatar?: string;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
    theme: StorefrontTheme;
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials, theme }) => {
    if (!testimonials || testimonials.length === 0) return null;

    const [activeIndex, setActiveIndex] = React.useState(0);

    const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <h2 className="text-2xl font-black uppercase tracking-widest whitespace-nowrap">
                    Social Proof
                </h2>
                <div className="h-px flex-1 bg-white/10 hidden md:block" />
            </div>

            <div className="relative overflow-hidden group">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                    {testimonials.map((t) => (
                        <div key={t.id} className="min-w-full px-1">
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Star size={120} />
                                </div>

                                <div className="relative space-y-6">
                                    <div className="flex gap-1 text-indigo-400">
                                        {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                    </div>

                                    <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-zinc-200">
                                        "{t.content}"
                                    </p>

                                    <div className="flex items-center gap-4 pt-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500/10 border-2 border-indigo-500/20">
                                            {t.avatar ? (
                                                <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold">
                                                    {t.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{t.name}</h4>
                                            <p className="text-xs text-zinc-500">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {testimonials.length > 1 && (
                    <div className="absolute bottom-8 right-8 flex gap-2">
                        <button
                            onClick={prev}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={next}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;
