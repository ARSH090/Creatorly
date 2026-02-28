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
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                            className="bg-zinc-900/20 p-8 rounded-2xl border border-white/5 text-left flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">{i + 1}</div>
                                    <h3 className="text-white font-bold text-lg">{item.title}</h3>
                                </div>
                                <p className="text-zinc-300">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
