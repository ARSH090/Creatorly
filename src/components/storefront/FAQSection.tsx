'use client';

import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StorefrontTheme } from '@/types/storefront.types';

interface FAQ {
    id: string;
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQ[];
    theme: StorefrontTheme;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, theme }) => {
    if (!faqs || faqs.length === 0) return null;

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <h2 className="text-2xl font-black uppercase tracking-widest whitespace-nowrap">
                    Common Questions
                </h2>
                <div className="h-px flex-1 bg-white/10 hidden md:block" />
            </div>

            <div className="space-y-3">
                {faqs.map((faq, idx) => (
                    <div
                        key={faq.id}
                        className={`bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === idx ? 'ring-1 ring-indigo-500/30 bg-white/[0.05]' : ''}`}
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <HelpCircle size={18} className="text-indigo-400 flex-shrink-0" />
                                <span className="font-bold text-white tracking-tight">{faq.question}</span>
                            </div>
                            <div className={`p-1.5 rounded-lg bg-white/5 text-zinc-500 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}>
                                {openIndex === idx ? <Minus size={16} /> : <Plus size={16} />}
                            </div>
                        </button>

                        <AnimatePresence>
                            {openIndex === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="px-6 pb-6 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-white/5 mx-6 py-6">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;
