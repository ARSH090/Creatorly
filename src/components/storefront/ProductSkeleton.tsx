'use client';

import React from 'react';

export default function ProductSkeleton() {
    return (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4 animate-pulse">
            <div className="aspect-[4/3] bg-zinc-800/50 rounded-2xl" />
            <div className="space-y-3">
                <div className="h-4 bg-zinc-800/50 rounded-full w-3/4" />
                <div className="h-6 bg-zinc-800/50 rounded-full w-1/4" />
            </div>
            <div className="h-12 bg-zinc-800/50 rounded-2xl w-full" />
        </div>
    );
}

export function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>
    );
}

/** Skeleton for the ServiceButtons section */
export function ServiceButtonsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-3" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/5 animate-pulse"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded-full w-2/3" />
                    </div>
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                </div>
            ))}
        </div>
    );
}

/** Skeleton for the LinksSection */
export function LinksSectionSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-4" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 animate-pulse"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-white/10 rounded-full w-1/2" />
                        <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white/10" />
                </div>
            ))}
        </div>
    );
}

