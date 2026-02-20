
'use client';

import { motion } from 'framer-motion';

interface ProfileProps {
    name: string;
    bio: string;
    imageUrl: string;
}

export default function Profile({ name, bio, imageUrl }: ProfileProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-10"
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-[2.5rem] blur-2xl animate-pulse"></div>
                <div className="relative w-28 h-28 rounded-[2.5rem] bg-zinc-900 border-2 border-white/10 p-1 group overflow-hidden shadow-2xl">
                    <img
                        src={imageUrl || '/creatorly-logo.png'}
                        alt={name}
                        className="w-full h-full rounded-[2.2rem] object-cover bg-black group-hover:scale-110 transition-transform duration-500"
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-xl shadow-lg border border-white/20">
                    <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.582 3.954H18a1 1 0 110 2h-1.464l-1.582 3.954-3.954 1.582V17a1 1 0 11-2 0v-1.323l-3.954-1.582-1.582-3.954H2a1 1 0 110-2h1.464l1.582-3.954 3.954-1.582V3a1 1 0 011-1z" />
                        </svg>
                    </motion.div>
                </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight">
                {name}
            </h1>
            <div className="w-12 h-1 bg-indigo-500/50 rounded-full mb-4"></div>
            <p className="text-zinc-400 text-sm font-semibold max-w-xs leading-relaxed uppercase tracking-wider opacity-80">
                {bio}
            </p>
        </motion.div>
    );
}
