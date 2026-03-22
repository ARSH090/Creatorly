'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Floating 3D card component using CSS perspective
function FloatingCard({ children, className, delay = 0, floatY = 15, style }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    floatY?: number;
    style?: React.CSSProperties;
}) {
    return (
        <motion.div
            className={className}
            animate={{ y: [0, -floatY, 0] }}
            transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{ transformStyle: 'preserve-3d', ...style }}
            whileHover={{
                scale: 1.05,
                rotateY: 5,
                rotateX: -5,
                transition: { duration: 0.2 }
            }}
        >
            {children}
        </motion.div>
    );
}

// Magnetic button effect
function MagneticButton({ children, className, href }: { children: React.ReactNode; className: string; href: string }) {
    const ref = useRef<HTMLAnchorElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 30 });
    const springY = useSpring(y, { stiffness: 300, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    return (
        <motion.a
            ref={ref}
            href={href}
            className={className}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
        >
            {children}
        </motion.a>
    );
}

export default function HeroSection() {
    const { scrollY } = useScroll();
    const phoneY = useTransform(scrollY, [0, 500], [0, -80]);
    const phoneRotate = useTransform(scrollY, [0, 500], [0, -8]);
    const contentY = useTransform(scrollY, [0, 500], [0, 60]);
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    return (
        <section className="relative overflow-hidden min-h-screen flex items-center bg-[#030303]" style={{ perspective: '1000px' }}>

            {/* Layered background with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-[#030303] to-purple-950/30" />

            {/* 3D depth glow orbs — parallax on scroll */}
            <motion.div
                style={{ y: useTransform(scrollY, [0, 500], [0, -40]) }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/8 rounded-full blur-[140px] pointer-events-none"
            />
            <motion.div
                style={{ y: useTransform(scrollY, [0, 500], [0, -60]) }}
                className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                style={{ y: useTransform(scrollY, [0, 500], [0, -20]) }}
                className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/6 rounded-full blur-[100px] pointer-events-none"
            />

            {/* Animated grid lines */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)'
                }}
            />

            {/* Floating particles with depth */}
            {mounted && [...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className={`absolute rounded-full pointer-events-none ${
                        i % 3 === 0 ? 'w-1.5 h-1.5 bg-indigo-500/25' :
                        i % 3 === 1 ? 'w-1 h-1 bg-purple-500/20' :
                        'w-0.5 h-0.5 bg-white/20'
                    }`}
                    style={{
                        left: `${(i * 37) % 100}%`,
                        top: `${(i * 29) % 100}%`,
                    }}
                    animate={{
                        y: [0, -(15 + (i % 4) * 8), 0],
                        x: [0, Math.sin(i) * 12, 0],
                        opacity: [0.15, 0.5, 0.15],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 4 + (i % 5),
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            <motion.div
                style={{ y: contentY, opacity }}
                className="container relative mx-auto px-6 py-32 md:py-48"
            >
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column */}
                    <div>
                        {/* Trust Badge — 3D glass effect */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, ease: 'backOut' }}
                            className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/10"
                            whileHover={{
                                scale: 1.03,
                                boxShadow: '0 0 20px rgba(99,102,241,0.2)',
                                borderColor: 'rgba(99,102,241,0.3)',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                <Shield className="w-4 h-4 text-indigo-400" />
                            </motion.div>
                            <span className="text-sm font-medium text-zinc-300">
                                Trusted by 10,000+ Indian Creators
                            </span>
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Main Headline — letter-by-letter reveal */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
                            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-white leading-[1.1]"
                        >
                            <motion.span
                                className="block"
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                Monetize Your
                            </motion.span>
                            <motion.span
                                className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.35, duration: 0.6 }}
                                style={{
                                    filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.3))',
                                }}
                            >
                                Indian Audience
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed"
                        >
                            The only platform where Indian creators build mobile-first stores that
                            <span className="font-semibold text-indigo-400"> actually convert fans into paying customers.</span>
                            <br />No coding. Just selling.
                        </motion.p>

                        {/* CTA — magnetic button effect */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="flex flex-col sm:flex-row gap-5 mb-12"
                        >
                            <MagneticButton
                                href="/auth/register"
                                className="group relative inline-flex items-center justify-center gap-3 bg-white text-black font-extrabold py-5 px-10 rounded-2xl transition-all duration-300 overflow-hidden"
                            >
                                {/* Shimmer sweep */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/30 to-transparent -skew-x-12"
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                />
                                <span className="relative z-10 uppercase tracking-tight">Start Free for 14 Days</span>
                                <motion.div
                                    className="relative z-10"
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </motion.div>
                            </MagneticButton>
                        </motion.div>

                        {/* Social Proof — staggered */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-4"
                        >
                            <p className="text-zinc-500 text-sm font-medium">Revenue generated this week:</p>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[
                                        'from-purple-500 to-indigo-500',
                                        'from-pink-500 to-rose-500',
                                        'from-orange-500 to-amber-500',
                                        'from-emerald-500 to-teal-500',
                                        'from-blue-500 to-cyan-500'
                                    ].map((gradient, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-12 h-12 rounded-full border-4 border-[#030303] bg-gradient-to-br ${gradient}`}
                                            initial={{ scale: 0, x: -20 }}
                                            animate={{ scale: 1, x: 0 }}
                                            transition={{ delay: 0.8 + i * 0.08, type: 'spring', stiffness: 300 }}
                                            whileHover={{ scale: 1.2, zIndex: 10 }}
                                            style={{ boxShadow: '0 0 15px rgba(99,102,241,0.25)' }}
                                        />
                                    ))}
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    <motion.p
                                        className="text-2xl font-bold text-white"
                                        animate={{ opacity: [0.8, 1, 0.8] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        ₹42,78,950+
                                    </motion.p>
                                    <p className="text-sm text-zinc-500">across 10,000+ creators</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column — 3D phone with perspective */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, rotateY: -15 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                        style={{ y: phoneY, rotateX: phoneRotate, transformStyle: 'preserve-3d', perspective: '1200px' }}
                        className="relative lg:h-[600px] flex items-center justify-center cursor-default"
                    >
                        <div className="relative mx-auto max-w-[280px] sm:w-80" style={{ transformStyle: 'preserve-3d' }}>

                            {/* Glow ring behind phone */}
                            <div className="absolute inset-0 rounded-[3rem] bg-indigo-500/20 blur-[40px] scale-90" />

                            {/* Phone Frame with 3D shadow */}
                            <motion.div
                                className="relative bg-zinc-900 rounded-[3rem] p-4 border border-white/10"
                                style={{
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                                    transformStyle: 'preserve-3d',
                                }}
                                whileHover={{
                                    rotateY: 5,
                                    rotateX: -3,
                                    transition: { duration: 0.4 }
                                }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20" />

                                {/* Screen */}
                                <div className="bg-[#f5f5f5] rounded-[2.2rem] overflow-hidden h-[580px] relative">
                                    {/* Store Header */}
                                    <div className="p-6 bg-indigo-600 pb-12">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md" />
                                            <div>
                                                <div className="w-24 h-4 bg-white/20 rounded-full mb-2" />
                                                <div className="w-16 h-3 bg-white/20 rounded-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Grid */}
                                    <div className="px-4 -mt-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="bg-white rounded-xl p-3 shadow-sm"
                                                    whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 1 + i * 0.1 }}
                                                >
                                                    <div className={`aspect-square rounded-lg mb-2 ${i % 2 === 0 ? 'bg-purple-100' : 'bg-pink-100'}`} />
                                                    <div className="w-full h-3 bg-zinc-100 rounded mb-1" />
                                                    <div className="w-12 h-3 bg-zinc-100 rounded" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Toast */}
                                    <motion.div
                                        initial={{ y: 60, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1.8, duration: 0.6, type: 'spring', stiffness: 200 }}
                                        className="absolute bottom-6 left-4 right-4 bg-zinc-900/90 backdrop-blur-md text-white p-4 rounded-2xl border border-white/10"
                                        style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.2)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </motion.div>
                                            <div>
                                                <p className="text-sm font-bold">₹499 received!</p>
                                                <p className="text-xs text-zinc-400">Payment successful</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Floating earnings card */}
                            <FloatingCard
                                delay={0}
                                floatY={12}
                                className="absolute -top-14 -right-14 bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 min-w-[160px]"
                                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.15)' }}
                            >
                                <div className="text-center">
                                    <motion.p
                                        className="text-2xl font-bold text-white"
                                        animate={{ opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        ₹24,580
                                    </motion.p>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">earned today</p>
                                </div>
                            </FloatingCard>

                            {/* Floating subscriber card */}
                            <FloatingCard
                                delay={1.2}
                                floatY={14}
                                className="absolute top-1/2 -left-24 bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center gap-3"
                                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.1)' }}
                            >
                                <motion.div
                                    className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white"
                                    animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.6)', '0 0 0px rgba(99,102,241,0)'] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                >
                                    <Zap className="w-5 h-5 fill-current" />
                                </motion.div>
                                <div>
                                    <p className="text-sm font-bold text-white">New Subscriber</p>
                                    <p className="text-xs text-zinc-400">via Instagram</p>
                                </div>
                            </FloatingCard>

                            {/* NEW: Trending card */}
                            <FloatingCard
                                delay={0.6}
                                floatY={10}
                                className="absolute -bottom-8 -right-10 bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-3 border border-white/10 flex items-center gap-2"
                                style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}
                            >
                                <motion.div
                                    className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </motion.div>
                                <div>
                                    <p className="text-xs font-bold text-white">+₹8,200</p>
                                    <p className="text-[10px] text-zinc-500">this hour</p>
                                </div>
                            </FloatingCard>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ opacity: useTransform(scrollY, [0, 200], [1, 0]) }}
            >
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Scroll</span>
                <div className="w-px h-8 bg-gradient-to-b from-zinc-600 to-transparent" />
            </motion.div>
        </section>
    );
}
