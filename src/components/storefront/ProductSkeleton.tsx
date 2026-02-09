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
