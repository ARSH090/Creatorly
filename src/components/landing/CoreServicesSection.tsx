'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ShoppingCart, BookOpen, Mail, Users, TrendingUp, Palette,
    Check
} from 'lucide-react';
import Image from 'next/image';

const CoreServicesSection: React.FC = () => {
    const services = [
        {
            image: "/landing-store.png",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
            title: "Sell Digital Products Instantly",
            description: "Launch your own branded storefront in minutes. Sell eBooks, templates, presets, software, music, art, and any digital file with automated delivery the moment payment clears.",
            features: [
                "Instant file delivery after purchase",
                "Unlimited product variants and pricing tiers",
                "Custom storefront with your own domain",
                "Built-in checkout with no redirects"
            ]
        },
        {
            image: "/landing-courses.png",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            title: "Teach, Train & Build Communities",
            description: "Build structured online courses with video lessons, drip content, and quizzes. Gate content behind one-time purchases or recurring memberships.",
            features: [
                "Video hosting & lesson sequencing",
                "Drip content scheduling",
                "Membership tiers with recurring billing",
                "Student progress tracking"
            ]
        },
        {
            image: "/landing-email.png",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            title: "Email Sequences That Sell While You Sleep",
            description: "Build powerful automation flows triggered by purchases, signups, or inactivity. Send the right message to the right customer at exactly the right moment.",
            features: [
                "Visual automation flow builder",
                "Behavior-triggered email sequences",
                "Subscriber segmentation & tagging",
                "Broadcast campaigns to full list"
            ]
        },
        {
            image: "/landing-success.png",
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            title: "Turn Customers Into Your Sales Team",
            description: "Launch your own affiliate program in one click. Set custom commission rates, generate unique referral links, and pay affiliates automatically via Stripe Connect.",
            features: [
                "Custom commission rates per product",
                "Unique affiliate links & tracking",
                "Real-time commission dashboard",
                "Automated payouts via Stripe Connect"
            ]
        },
        {
            image: "/landing-analytics.png",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
            title: "Know Exactly What's Working",
            description: "Track every click, view, and conversion across your entire store. Understand your best-performing products, traffic sources, and customer lifetime value in one clean dashboard.",
            features: [
                "Real-time revenue and sales tracking",
                "Product-level conversion analytics",
                "Traffic source attribution",
                "Customer lifetime value reporting"
            ]
        },
        {
            image: "/logo.png",
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
            title: "Your Brand, Your Store, Your Rules",
            description: "Fully customize your storefront's look and feel without writing a single line of code. Connect your own domain, choose your theme, and create a buying experience that matches your brand perfectly.",
            features: [
                "Custom domain connection (free SSL)",
                "Theme editor with live preview",
                "Custom checkout branding",
                "Mobile-optimized by default"
            ]
        }
    ];

    return (
        <section className="py-24 px-6 bg-[#030303] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white mb-6"
                    >
                        Everything You Need to <br />
                        <span className="text-zinc-500">Sell, Grow & Scale</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-zinc-400 text-lg"
                    >
                        One platform. All the tools. Zero complexity.
                    </motion.p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {services.map((service, i) => {
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                                className={`group relative p-8 rounded-2xl border ${service.border} ${service.bg} backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 hover:shadow-xl hover:shadow-${service.color.split('-')[1]}-500/20`}
                            >
                                {/* Icon / Image */}
                                <div className={`w-14 h-14 rounded-xl ${service.bg} border ${service.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative overflow-hidden`}>
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        width={80}
                                        height={80}
                                        className="object-contain p-2"
                                    />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                                    {service.title}
                                </h3>

                                {/* Description */}
                                <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
                                    {service.description}
                                </p>

                                {/* Features List */}
                                <div className="space-y-3 pt-5 border-t border-white/5">
                                    {service.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Check className={`w-4 h-4 ${service.color} flex-shrink-0 mt-1`} />
                                            <span className="text-xs text-zinc-500">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 p-12 md:p-16 text-center"
                >
                    {/* Background Effect */}
                    <div className="absolute inset-0 opacity-50 pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 blur-[100px]" />
                    </div>

                    <div className="relative z-10">
                        <motion.h3
                            className="text-3xl md:text-4xl font-bold text-white mb-4"
                        >
                            Ready to start selling?
                        </motion.h3>

                        <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
                            Join thousands of creators already building their business on Creatorly.
                            <br />
                            No monthly fees. No technical setup. Just results.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/auth/register"
                                className="group px-10 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 active:scale-95 hover:scale-105"
                            >
                                Start Now — It's Free
                            </Link>

                            <a
                                href="#how-it-works"
                                className="px-8 py-4 rounded-full border border-zinc-500/30 text-zinc-300 font-semibold hover:border-zinc-400/50 hover:text-white transition-all duration-300 hover:bg-white/5"
                            >
                                See how it works →
                            </a>
                        </div>

                        <p className="text-xs text-zinc-500 mt-6">
                            No credit card required. Activate your store in 30 seconds.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CoreServicesSection;
