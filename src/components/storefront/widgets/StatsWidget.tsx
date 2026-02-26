'use client';

import React, { useRef } from 'react';
import CountUp from 'react-countup';
import { useInView } from 'framer-motion';
import type { StatsSettings } from '@/types/storefront-blocks.types';

interface StatsWidgetProps {
    settings: StatsSettings;
    theme: Record<string, string>;
}

export default function StatsWidget({ settings, theme }: StatsWidgetProps) {
    const { items = [], layout = 'row', title } = settings;
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    const borderRadius = Number(theme.borderRadius || 12);
    const primaryColor = theme.primaryColor || '#6366f1';

    if (!items.length) return null;

    const parseNumber = (val: string): number => {
        const n = parseFloat(val.replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
    };

    return (
        <section className="w-full py-4" ref={ref}>
            {title && (
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor || '#fff' }}>
                        {title}
                    </h2>
                    <div className="h-px flex-1 opacity-10" style={{ backgroundColor: theme.textColor || '#fff' }} />
                </div>
            )}

            <div
                className={layout === 'row'
                    ? 'flex flex-wrap justify-center gap-4'
                    : 'grid grid-cols-2 md:grid-cols-3 gap-4'
                }
            >
                {items.map(stat => (
                    <div
                        key={stat.id}
                        className="flex flex-col items-center gap-1 p-5 text-center flex-1 min-w-[120px]"
                        style={{
                            backgroundColor: theme.cardColor || 'rgba(255,255,255,0.04)',
                            borderRadius,
                            border: `1px solid ${primaryColor}22`,
                        }}
                    >
                        {stat.icon && <span className="text-2xl mb-1">{stat.icon}</span>}
                        <div className="text-3xl font-black" style={{ color: primaryColor }}>
                            {stat.prefix || ''}
                            {inView ? (
                                <CountUp
                                    end={parseNumber(stat.number)}
                                    duration={2.5}
                                    separator=","
                                    decimals={stat.number.includes('.') ? 1 : 0}
                                />
                            ) : (
                                <span>0</span>
                            )}
                            {stat.suffix || (stat.number.includes('+') ? '+' : '')}
                        </div>
                        <p className="text-sm font-semibold opacity-60" style={{ color: theme.textColor || '#fff' }}>
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
