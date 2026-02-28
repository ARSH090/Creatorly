'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: string;
}

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqItems: FAQItem[] = [
        {
            question: 'Is Creatorly really free to start?',
            answer: 'Yes. Our free forever plan includes everything you need to build your first store, create landing pages, and set up email automation. No credit card required. When you\'re ready to scale, upgrade to Pro for advanced features like custom domains, affiliate systems, and AI tools.',
        },
        {
            question: 'Do I need technical skills to set up my store?',
            answer: 'Not at all. Creatorly is built for creators, not developers. Our drag-and-drop store builder, point-and-click email automation, and visual workflow system require zero coding knowledge. Most creators launch their first store in under 30 minutes.',
        },
        {
            question: 'Can I use my own custom domain?',
            answer: 'Yes, absolutely. On Pro and above, you can connect any domain you own (from any registrar) in 5 steps. We handle the SSL certificate, DNS configuration, and email setup automatically. No technical knowledge required.',
        },
        {
            question: 'How does Creatorly compare to Stan Store?',
            answer: 'Both are creator-focused platforms, but Creatorly is all-in-one. Stan Store is great for stores, but you\'ll need separate tools for email, courses, and analytics. Creatorly bundles everything — and no 5% transaction fee on Pro. See our full comparison table above.',
        },
        {
            question: 'What payment methods does Creatorly support?',
            answer: 'We support all major payment methods through Stripe: credit/debit cards, Apple Pay, Google Pay, and BNPL options like Klarna and Afterpay. We accept 135+ currencies and handle tax compliance for you. Payouts to your bank account happen automatically.',
        },
        {
            question: 'Can I migrate from another platform?',
            answer: 'Yes. We support data imports from most competitors including Gumroad, Teachable, and Stripe-based stores. Our migration team can help you move your products, subscribers, and customer data safely. Contact support@creatorly.com for assistance.',
        },
        {
            question: 'What happens to my content if I cancel?',
            answer: 'Your content is always yours. If you cancel, we\'ll provide a 30-day export window for all your products, customer data, and content. You\'re never locked in — you can leave anytime. We even maintain your domain\'s SSL for a grace period.',
        },
        {
            question: 'How does the affiliate system work?',
            answer: 'Launch your affiliate program in one click. Set custom commission rates per product, affiliates get unique referral links, and they can track earnings in their dashboard. Commissions pay out automatically via Stripe Connect. No manual work required.',
        },
        {
            question: 'Is there a transaction fee?',
            answer: 'On our Free plan, we take 2% per transaction. On Pro and above, 0% transaction fee — we just charge a monthly subscription. This means on Pro, you keep 100% of every sale, minus payment processor fees (Stripe is 2.9% + $0.30).',
        },
        {
            question: 'Do you offer customer support?',
            answer: 'Yes. Free plan: community support + email. Pro and above: priority email support with <2 hour response time + Slack integration. Elite: dedicated account manager. All plans have access to our knowledge base, video tutorials, and creator community.',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 },
        },
    };

    return (
        <section className="py-24 md:py-32 bg-[#030303] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/5 to-transparent pointer-events-none" />

            <motion.div
                className="container mx-auto px-6 relative z-10 max-w-3xl"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* Section Header */}
                <motion.div className="text-center mb-16" variants={itemVariants}>
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Common Questions
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        FAQ: Everything You Need to Know
                    </h2>
                    <p className="text-lg text-zinc-400">
                        Find answers to the most common questions creators ask us before joining Creatorly.
                    </p>
                </motion.div>

                {/* FAQ List */}
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                >
                    {faqItems.map((item, index) => (
                        <motion.div
                            key={index}
                            className="border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors"
                            variants={itemVariants}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 flex items-start justify-between gap-4 text-left hover:bg-white/2 transition-colors group"
                            >
                                <span className="font-semibold text-white text-lg pr-4 group-hover:text-indigo-400 transition-colors">
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform duration-300 ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="px-6 pb-6 pt-2 text-zinc-300 border-t border-white/5 bg-white/1">
                                            {item.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Still Have Questions CTA */}
                <motion.div
                    className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center"
                    variants={itemVariants}
                >
                    <h3 className="text-xl font-bold text-white mb-3">Still have questions?</h3>
                    <p className="text-zinc-400 mb-6">
                        Our support team is here to help. Reach out anytime — we respond within 2 hours.
                    </p>
                    <a
                        href="mailto:support@creatorly.com"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm uppercase tracking-wide"
                    >
                        Chat with Us
                        <span>→</span>
                    </a>
                </motion.div>
            </motion.div>
        </section>
    );
}
