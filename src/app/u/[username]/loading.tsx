import React from 'react';

export default function StorefrontLoading() {
    return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center py-12 px-6 space-y-12 animate-pulse">
            {/* Profile Header Skeleton */}
            <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white/10" />
                <div className="h-6 w-48 bg-white/5 rounded-lg" />
                <div className="h-4 w-64 bg-white/5 rounded-lg" />
            </div>

            {/* Links Section Skeleton */}
            <div className="w-full max-w-2xl space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/10" />
                ))}
            </div>

            {/* Products Grid Skeleton */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 bg-white/5 rounded-3xl border border-white/10" />
                ))}
            </div>
        </div>
    );
}
