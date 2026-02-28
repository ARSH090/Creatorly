'use client';

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700",
                className
            )}
        >
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-full p-8 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                    <Icon className="w-12 h-12 text-indigo-500" strokeWidth={1} />
                </div>
            </div>

            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3">
                {title}
            </h3>
            <p className="max-w-xs mx-auto text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-relaxed mb-10">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-white text-black h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
