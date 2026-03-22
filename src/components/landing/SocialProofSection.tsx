'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const SocialProofSection: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-[#030303] border-t border-white/5">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-8">Built with creators in mind</h2>

                <p className="text-zinc-400 max-w-2xl mx-auto mb-12">No fake testimonials — just practical outcomes. Creatorly focuses on independence, ownership, and predictable payouts.</p>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Owner-first Payouts",
                            desc: "Keep more of what you earn with zero platform fees on Pro. Fast UPI and bank payouts."
                        },
                        {
                            title: "Simple Product Delivery",
                            desc: "Automated delivery for digital products — instant access, no manual steps."
                        },
                        {
                            title: "Actionable Analytics",
                            desc: "Clear conversion data so you know which posts actually sell."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
                            whileHover={{ y: -5, scale: 1.02, rotateX: -2, transition: { duration: 0.2 } }}
                            className="group relative bg-zinc-900/40 p-8 rounded-2xl border border-white/5 border-t-white/10 text-left flex flex-col justify-between overflow-hidden shadow-2xl shadow-indigo-900/10 cursor-default"
                            style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
                        >
                            {/* Hover light sweep */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            />
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-500/20 transition-colors">
                                        {i + 1}
                                        {/* Pulsing glow dot */}
                                        <motion.div
                                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                            style={{ boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
                                        />
                                    </div>
                                    <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                                </div>
                                <p className="text-zinc-300 relative z-10">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
