'use client';

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "avatar" | "rect" | "card" | "table-row";
}

export function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
    const variants = {
        text: "h-4 w-full rounded-md",
        avatar: "h-12 w-12 rounded-full",
        rect: "h-24 w-full rounded-xl",
        card: "h-48 w-full rounded-[2rem]",
        "table-row": "h-16 w-full rounded-xl",
    };

    return (
        <div
            className={cn(
                "animate-shimmer bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%] border border-white/5",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full space-y-4 animate-in fade-in duration-500">
            <div className="flex gap-4 mb-8">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} variant="text" className="h-10 rounded-xl" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} variant="table-row" />
            ))}
        </div>
    );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} variant="card" />
            ))}
        </div>
    );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={cn(
            "grid grid-cols-1 gap-6 animate-in fade-in duration-500",
            count === 1 ? "md:grid-cols-1" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-4"
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
                    <Skeleton variant="text" className="w-24 h-3 opacity-50" />
                    <Skeleton variant="text" className="w-16 h-8" />
                </div>
            ))}
        </div>
    );
}
