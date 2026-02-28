'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, BookOpen, Palette, Mic, Code, Dumbbell } from 'lucide-react';

const UseCasesSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    const cases = [
        {
            role: "Influencers",
            icon: Camera,
            desc: "Add all your affiliate links and brand deals in one bio link. Track clicks and prove ROI to sponsors.",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            role: "Educators",
            icon: BookOpen,
            desc: "Sell your PDF guides, workshops, and coaching calls. We handle the content delivery securely.",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20"
        },
        {
            role: "Digital Artists",
            icon: Palette,
            desc: "Sell your presets, brush packs, and templates. Instant downloads for your customers worldwide.",
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20"
        },
        {
            role: "Podcasters",
            icon: Mic,
            desc: "Share latest episodes, sell merch, and collect listener support in one clean interface.",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            role: "Developers",
            icon: Code,
            desc: "Sell code snippets, templates, and SaaS subscriptions directly to other developers.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            role: "Fitness Coaches",
            icon: Dumbbell,
            desc: "Sell workout plans, diet charts, and book 1:1 sessions with automated scheduling.",
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20"
        }
    ];

    return (
        <section ref={containerRef} className="py-32 bg-[#050505] overflow-hidden border-y border-white/5 relative">
            <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl sm:text-5xl font-semibold text-white mb-6">Built for every <br /><span className="text-zinc-500">kind of creator.</span></h2>
                    <p className="text-zinc-400 max-w-xl">Whether you're teaching, entertaining, or building tools—Creatorly adapts to your business model.</p>
                </div>
                {/* Scroll Indicator */}
                <div className="hidden md:flex gap-2 text-zinc-600 text-sm font-bold uppercase tracking-widest items-center">
                    <span>Scroll to Explore</span>
                    <div className="w-12 h-px bg-zinc-800" />
                </div>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="relative w-full">
                <div className="flex gap-6 px-6 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar md:hidden">
                    {cases.map((useCase, i) => (
                        <div
                            key={i}
                            className="snap-center shrink-0 w-[300px] bg-zinc-900/40 rounded-3xl p-8 border border-white/5 flex flex-col"
                        >
                            <div className={`w-12 h-12 rounded-xl ${useCase.bg} flex items-center justify-center ${useCase.color} mb-6 border ${useCase.border}`}>
                                <useCase.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{useCase.role}</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                {useCase.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Desktop Parallax/Marquee */}
                <motion.div
                    style={{ x }}
                    className="hidden md:flex gap-8 px-6 w-max"
                >
                    {cases.map((useCase, i) => (
                        <div
                            key={i}
                            className="w-[400px] h-[280px] bg-zinc-900/20 backdrop-blur-sm rounded-[32px] p-10 border border-white/5 flex flex-col justify-between hover:bg-zinc-900/40 transition-colors duration-500 group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${useCase.bg} flex items-center justify-center ${useCase.color} border ${useCase.border} group-hover:scale-110 transition-transform duration-500`}>
                                        <useCase.icon className="w-7 h-7" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest border border-zinc-800 px-3 py-1 rounded-full">{`0${i + 1}`}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{useCase.role}</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed text-sm font-medium">
                                {useCase.desc}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default UseCasesSection;
