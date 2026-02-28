
'use client';

import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight, CalendarCheck } from 'lucide-react';
// We'll use Lucide for all to keep it simple and consistent with project dependencies
// If specific brand icons are needed, we can import from simple-icons or similar, 
// but for now I'll use Lucide generic or text.
// Actually, let's use a map or pass icon component. 
// Project has lucide-react. I will use Lucide icons where possible.

import { MessageCircle, Instagram, Send, Link as LinkIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    whatsapp: MessageCircle,
    instagram: Instagram,
    telegram: Send,
    consultation: CalendarCheck,
    default: LinkIcon
};

interface ServiceButtonProps {
    service: string;
    label: string;
    onClick: (service: string) => void;
}

export default function ServiceButton({ service, label, onClick }: ServiceButtonProps) {
    const Icon = iconMap[service.toLowerCase()] || iconMap.default;

    return (
        <motion.button
            whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
                e.preventDefault();
                onClick(service);
            }}
            className="w-full flex items-center px-6 py-5 bg-white/[0.04] backdrop-blur-md rounded-2xl text-white font-black border border-white/10 hover:border-indigo-500/50 transition-all group relative overflow-hidden"
        >
            {/* Hover Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
            </div>
            <span className="flex-1 text-left text-sm tracking-tight">{label}</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
        </motion.button>
    );
}
