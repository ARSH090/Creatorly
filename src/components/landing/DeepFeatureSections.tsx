'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Mail, BookOpen, TrendingUp, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DeepFeature {
    id: string;
    category: string;
    title: string;
    description: string;
    features: string[];
    stat: string;
    image: string;
    layout: 'left' | 'right';
    cta: string;
}

const deepFeatures: DeepFeature[] = [
    {
        id: 'store-commerce',
        category: 'Store & Commerce',
        title: 'Launch Your Store in 10 Minutes. Start Earning Today.',
        description: 'No design skills needed. No coding. No $10,000 designer bill. Creatorly gives you a premium store experience that looks professionally designed — built in minutes. Sell digital products, physical products, or both.',
        features: [
            'Drag-and-drop store editor with live preview',
            'Custom color palette, fonts, and layout blocks',
            'Mobile-optimized storefront out of the box',
            'SEO metadata editor per page',
            'Built-in loading speed optimization (sub-2s stores)',
            'Coupon and discount code engine'
        ],
        stat: 'Creators using Creatorly stores earn 3x more than link-in-bio only',
        image: "/landing-store.png",
        layout: 'left',
        cta: 'Start Selling Free'
    },
    {
        id: 'email-marketing',
        category: 'Growth & Audience',
        title: 'Stop Paying $200/Month for Mailchimp. Build Your Email Empire Here.',
        description: 'Your email list is your most valuable asset. Creatorly gives you enterprise-grade email marketing with automation, segmentation, and behavioral triggers — all built in. No separate tool needed.',
        features: [
            'Subscriber collection forms and landing pages',
            'Visual automation flow builder (trigger → delay → send)',
            'Behavior-triggered campaigns (purchase, signup, inactivity)',
            'Advanced segmentation with tags and conditions',
            'Broadcast campaigns to full list or specific segments',
            'Deliverability analytics: open rate, click rate, revenue per email'
        ],
        stat: 'Creators using email automation see 5x higher conversion rates',
        image: "/landing-email.png",
        layout: 'right',
        cta: 'Replace Your Email Tool'
    },
    {
        id: 'courses-memberships',
        category: 'Education & Community',
        title: 'Build Courses That Generate Recurring Revenue. No Monthly Fees.',
        description: 'Teachable charges 5-10% of each course sale PLUS a monthly fee. Creatorly charges 0% on Pro. Host your courses natively, gate content by membership tier, and build a community that actually stays connected.',
        features: [
            'Video hosting with HLS adaptive streaming',
            'Lesson sequencing with drag-and-drop module builder',
            'Drip content: release lessons on a schedule',
            'Student progress tracking and completion certificates',
            'Discussion boards and community per course',
            'Multiple membership tiers with different pricing'
        ],
        stat: 'Course creators on Creatorly save $8-15k annually in platform fees',
        image: "/landing-courses.png",
        layout: 'left',
        cta: 'Launch Your First Course'
    },
    {
        id: 'analytics-power',
        category: 'Insights & Intelligence',
        title: 'See Exactly What\'s Making You Money. Stop Guessing.',
        description: 'Most creators fly blind. They don\'t know which products are profitable, which traffic sources convert best, or what their customer lifetime value actually is. Creatorly gives you real-time analytics that matter.',
        features: [
            'Real-time revenue and transaction tracking',
            'Product-level conversion rates and revenue breakdown',
            'Traffic source attribution (social, organic, email, direct)',
            'Customer lifetime value and repeat purchase rate',
            'Funnel analytics: visitor → checkout → purchase',
            'Daily digest email: yesterday\'s performance summary'
        ],
        stat: 'Creators with data insight increase revenue by 40% on average',
        image: "/landing-analytics.png",
        layout: 'right',
        cta: 'See Your Real Numbers'
    }
];

export default function DeepFeatureSections() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 },
        },
    };

    return (
        <section className="py-24 md:py-32 bg-[#030303]">
            <motion.div
                className="container mx-auto px-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-150px" }}
            >
                {/* Section Header */}
                <motion.div className="text-center mb-24" variants={itemVariants}>
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Deep Dive
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        The Features That Actually Matter
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Every service goes deeper than you'd expect. Here's what sets Creatorly apart.
                    </p>
                </motion.div>

                {/* Deep Feature Cards */}
                <div className="space-y-24">
                    {deepFeatures.map((feature, idx) => (
                        <motion.div
                            key={feature.id}
                            className={`grid lg:grid-cols-2 gap-12 items-center ${feature.layout === 'right' ? 'lg:auto-cols-fr' : ''}`}
                            variants={itemVariants}
                        >
                            {/* Content Side */}
                            <motion.div
                                className={feature.layout === 'right' ? 'lg:order-2' : 'lg:order-1'}
                                variants={itemVariants}
                            >
                                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                    {feature.category}
                                </span>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-6 leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-zinc-300 mb-8 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Features List */}
                                <div className="space-y-4 mb-8">
                                    {feature.features.map((f, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                                            <span className="text-zinc-300 font-medium">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Stat Box */}
                                <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-8">
                                    <p className="text-indigo-300 font-semibold text-lg">
                                        {feature.stat}
                                    </p>
                                </div>

                                {/* CTA Button */}
                                <Link
                                    href="/auth/register"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all uppercase tracking-wide text-sm"
                                >
                                    {feature.cta}
                                    <span>→</span>
                                </Link>
                            </motion.div>

                            {/* Visual Side */}
                            <motion.div
                                className={`relative ${feature.layout === 'right' ? 'lg:order-1' : 'lg:order-2'}`}
                                variants={itemVariants}
                            >
                                <div className="relative h-[400px] rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 p-8 flex items-center justify-center">
                                    {/* Placeholder for feature visualization */}
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
                                    </div>

                                    <div className="relative z-10 flex items-center justify-center">
                                        <Image
                                            src={feature.image}
                                            alt={feature.title}
                                            width={240}
                                            height={240}
                                            className="object-contain drop-shadow-2xl"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA Section */}
                <motion.div
                    className="mt-24 text-center"
                    variants={itemVariants}
                >
                    <p className="text-lg text-zinc-400 mb-8">
                        These are just the highlights. Every feature is production-ready and trusted by thousands of creators.
                    </p>
                    <Link
                        href="/features"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/50 transition-all uppercase tracking-wide text-sm"
                    >
                        View All Features
                        <span>→</span>
                    </Link>
                </motion.div>
            </motion.div>
        </section>
    );
}
