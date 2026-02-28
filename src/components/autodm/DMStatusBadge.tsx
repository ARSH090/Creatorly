'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    MessageCircle,
    Instagram,
    Loader2
} from 'lucide-react';

type DMStatus = 'pending' | 'sent' | 'failed' | 'coming_soon';
type Provider = 'instagram' | 'whatsapp';

interface DMStatusBadgeProps {
    status: DMStatus;
    provider: Provider;
    className?: string;
    showIcon?: boolean;
    animate?: boolean;
}

interface StatusConfig {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
}

const statusConfig: Record<DMStatus, StatusConfig> = {
    pending: {
        label: 'Sending...',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-400',
        icon: Clock,
    },
    sent: {
        label: 'Sent',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        icon: CheckCircle2,
    },
    failed: {
        label: 'Failed',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        icon: AlertCircle,
    },
    coming_soon: {
        label: 'Coming Soon',
        bgColor: 'bg-zinc-500/10',
        borderColor: 'border-zinc-500/30',
        textColor: 'text-zinc-400',
        icon: Clock,
    },
};

export default function DMStatusBadge({ 
    status, 
    provider, 
    className = '',
    showIcon = true,
    animate = false 
}: DMStatusBadgeProps) {
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const ProviderIcon = provider === 'instagram' ? Instagram : MessageCircle;
    
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}>
            {showIcon && (
                animate ? (
                    <motion.div
                        animate={{ rotate: status === 'pending' ? 360 : 0 }}
                        transition={{ 
                            repeat: status === 'pending' ? Infinity : 0, 
                            duration: 1, 
                            ease: 'linear' 
                        }}
                    >
                        <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
                    </motion.div>
                ) : (
                    <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
                )
            )}
            
            {provider && (
                <ProviderIcon className="w-3 h-3 text-zinc-500" />
            )}
            
            <span className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
            </span>
        </div>
    );
}

export function DMStatusLoading({ provider }: { provider: Provider }) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-500/10 border border-zinc-500/30">
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            <span className="text-xs font-medium text-zinc-400">
                Sending via {provider}...
            </span>
        </div>
    );
}

export function DMStatusError({ error, onRetry, isRetrying }: { 
    error?: string; 
    onRetry?: () => void; 
    isRetrying?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-400">
                    {error || 'Failed to send'}
                </span>
            </div>
            
            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            )}
        </div>
    );
}
