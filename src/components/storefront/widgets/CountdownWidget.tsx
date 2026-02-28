'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { CountdownSettings } from '@/types/storefront-blocks.types';

interface CountdownWidgetProps {
    settings: CountdownSettings;
    theme: Record<string, string>;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
    };
}

function FlipUnit({ value, label, color }: { value: number; label: string; color: string }) {
    const display = String(value).padStart(2, '0');
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative"
                style={{ perspective: '200px' }}
            >
                <div
                    className="w-16 h-20 flex items-center justify-center text-4xl font-black leading-none"
                    style={{
                        backgroundColor: color + '22',
                        border: `2px solid ${color}44`,
                        borderRadius: 8,
                        color,
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {display}
                </div>
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderTop: `1px solid ${color}33`, top: '50%' }}
                />
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-50">{label}</span>
        </div>
    );
}

function DigitalUnit({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-5xl font-black tracking-tighter font-mono" style={{ color }}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mt-1">{label}</span>
        </div>
    );
}

function CircleUnit({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const dash = circ - (value / max) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" stroke={`${color}22`} />
                    <circle
                        cx="32" cy="32" r={r}
                        fill="none" strokeWidth="4" stroke={color}
                        strokeDasharray={circ}
                        strokeDashoffset={dash}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
                <span
                    className="absolute inset-0 flex items-center justify-center font-black text-lg"
                    style={{ color }}
                >
                    {value}
                </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</span>
        </div>
    );
}

export default function CountdownWidget({ settings, theme }: CountdownWidgetProps) {
    const {
        targetDate,
        style = 'digital',
        showDays = true, showHours = true, showMinutes = true, showSeconds = true,
        onExpire = 'message',
        expireMessage = 'The offer has ended.',
        expireUrl,
        label,
    } = settings;

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        targetDate ? calculateTimeLeft(targetDate) : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false }
    );

    useEffect(() => {
        if (!targetDate) return;
        const tick = () => setTimeLeft(calculateTimeLeft(targetDate));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    useEffect(() => {
        if (timeLeft.expired && onExpire === 'redirect' && expireUrl) {
            window.location.href = expireUrl;
        }
    }, [timeLeft.expired, onExpire, expireUrl]);

    const primaryColor = theme.primaryColor || '#6366f1';
    const borderRadius = Number(theme.borderRadius || 12);

    if (!targetDate) {
        return (
            <div className="text-center py-8 opacity-30">
                <p className="text-4xl mb-2">⏳</p>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Set a target date</p>
            </div>
        );
    }

    if (timeLeft.expired && onExpire === 'message') {
        return (
            <div className="text-center py-8">
                <p className="text-xl font-bold" style={{ color: theme.textColor }}>{expireMessage}</p>
            </div>
        );
    }

    if (timeLeft.expired && onExpire === 'hide') return null;

    const units = [
        { key: 'days', value: timeLeft.days, max: 365, label: 'Days', show: showDays },
        { key: 'hours', value: timeLeft.hours, max: 24, label: 'Hours', show: showHours },
        { key: 'minutes', value: timeLeft.minutes, max: 60, label: 'Minutes', show: showMinutes },
        { key: 'seconds', value: timeLeft.seconds, max: 60, label: 'Seconds', show: showSeconds },
    ].filter(u => u.show);

    return (
        <div className="w-full py-6 text-center space-y-4" style={{ borderRadius }}>
            {label && (
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: theme.textColor }}>{label}</h3>
            )}
            <div className="flex justify-center items-end gap-4 flex-wrap">
                {units.map((u, i) => (
                    <React.Fragment key={u.key}>
                        {style === 'flip' && <FlipUnit value={u.value} label={u.label} color={primaryColor} />}
                        {style === 'digital' && <DigitalUnit value={u.value} label={u.label} color={primaryColor} />}
                        {style === 'minimal' && (
                            <div className="text-center">
                                <span className="text-4xl font-black" style={{ color: primaryColor }}>
                                    {String(u.value).padStart(2, '0')}
                                </span>
                                <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1" style={{ color: theme.textColor }}>{u.label}</p>
                            </div>
                        )}
                        {style === 'circle' && <CircleUnit value={u.value} max={u.max} label={u.label} color={primaryColor} />}
                        {/* Separator */}
                        {i < units.length - 1 && style !== 'circle' && (
                            <span className="text-3xl font-black opacity-30 pb-4" style={{ color: primaryColor }}>:</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
