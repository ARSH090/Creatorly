
'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    visible: boolean;
}

export default function LoadingSpinner({ visible }: LoadingSpinnerProps) {
    if (!visible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
        >
            <div className="w-12 h-12 border-4 border-white/10 border-t-[#00ff88] rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,136,0.4)]" />
        </motion.div>
    );
}
