'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Camera, Play, Mail, Calendar,
    Send, Twitter, Linkedin, Music2, ExternalLink,
    Link2, Sparkles,
} from 'lucide-react';
import type { ServiceButton, StorefrontTheme } from '@/types/storefront.types';
import { getBorderRadiusClass, primaryWithOpacity } from '@/utils/theme.utils';
import { useLeadStore } from '@/lib/store/useLeadStore';

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
    whatsapp: MessageCircle,
    instagram: Camera,
    youtube: Play,
    email: Mail,
    booking: Calendar,
    telegram: Send,
    twitter: Twitter,
    linkedin: Linkedin,
    tiktok: Music2,
    custom: ExternalLink,
};

function ServiceIcon({ serviceType, className }: { serviceType: string; className?: string }) {
    const Icon = ICON_MAP[serviceType] ?? Link2;
    return <Icon className={className} aria-hidden="true" />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyButtonsPlaceholder({ primaryColor }: { primaryColor: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-50">
            <Sparkles className="w-8 h-8" style={{ color: primaryColor }} />
            <p className="text-sm font-medium">No services added yet</p>
            <p className="text-xs opacity-60">This creator hasn&apos;t set up their services yet.</p>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ServiceButtonsProps {
    buttons: ServiceButton[];
    theme: StorefrontTheme;
    creatorUsername: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceButtons({
    buttons,
    theme,
    creatorUsername,
}: ServiceButtonsProps) {
    const { openLeadModal } = useLeadStore();

    const visibleButtons = useMemo(
        () =>
            buttons
                .filter((b) => b.isVisible)
                .sort((a, b) => a.order - b.order),
        [buttons]
    );

    const radiusClass = useMemo(
        () => getBorderRadiusClass(theme.buttonStyle),
        [theme.buttonStyle]
    );

    const handleClick = useCallback(
        (button: ServiceButton) => {
            if (button.modalEnabled) {
                openLeadModal({
                    id: button.id,
                    label: button.label,
                    type: 'service'
                });
            } else if (button.link) {
                window.open(button.link, '_blank', 'noopener,noreferrer');
            }

            // Fire-and-forget analytics
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'button_click',
                    metadata: { buttonId: button.id, serviceType: button.serviceType, creatorUsername },
                }),
            }).catch(() => { /* ignore */ });
        },
        [openLeadModal, creatorUsername]
    );

    if (visibleButtons.length === 0) {
        return <EmptyButtonsPlaceholder primaryColor={theme.primaryColor} />;
    }

    return (
        <section aria-label="Services" className="w-full max-w-2xl mx-auto space-y-3">
            <AnimatePresence>
                {visibleButtons.map((button, index) => (
                    <motion.button
                        key={button.id}
                        onClick={() => handleClick(button)}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        data-testid={`service-button-${index}`}
                        aria-label={button.label}
                        className={`
                            group relative flex items-center gap-4 w-full px-5 py-4
                            border transition-all duration-200 text-left
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                            ${radiusClass}
                        `}
                        style={{
                            backgroundColor: primaryWithOpacity(theme.primaryColor, 0.06),
                            borderColor: primaryWithOpacity(theme.primaryColor, 0.25),
                            color: theme.textColor,
                            // @ts-ignore — CSS custom property
                            '--focus-ring-color': theme.primaryColor,
                        }}
                    >
                        {/* Icon bubble */}
                        <span
                            className={`
                                flex-shrink-0 w-11 h-11 flex items-center justify-center
                                transition-colors duration-200 ${radiusClass}
                            `}
                            style={{
                                backgroundColor: primaryWithOpacity(theme.primaryColor, 0.18),
                                color: theme.primaryColor,
                            }}
                        >
                            <ServiceIcon serviceType={button.serviceType} className="w-5 h-5" />
                        </span>

                        {/* Label */}
                        <span className="flex-1 font-semibold text-sm sm:text-base leading-tight">
                            {button.label}
                        </span>

                        {/* Arrow */}
                        <ExternalLink
                            className="w-4 h-4 opacity-30 group-hover:opacity-80 transition-opacity"
                            aria-hidden="true"
                        />

                        {/* Hover glow overlay */}
                        <span
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                                boxShadow: `0 0 24px ${primaryWithOpacity(theme.primaryColor, 0.25)}`,
                                borderRadius: 'inherit',
                            }}
                        />
                    </motion.button>
                ))}
            </AnimatePresence>
        </section>
    );
}
