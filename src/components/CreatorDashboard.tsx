"use client";

import React from 'react';

export default function CreatorDashboard() {
    const stats = [
        { label: 'Total Revenue', value: '₹12,45,000', change: '+12.5% 📈' },
        { label: 'Active Customers', value: '4,520', change: '+5% 🇮🇳' },
        { label: 'Order Velocity', value: '8.4/hr', change: 'Stable' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Desktop Only */}
            <aside className="w-64 bg-white border-r border-black/5 p-6 hidden lg:flex flex-col">
                <h2 className="text-xl font-bold text-bharat-gradient mb-12 uppercase tracking-tighter">Creatorly</h2>
                <nav className="space-y-6 flex-1">
                    {['Analytics', 'Products', 'Orders', 'WhatsApp AI', 'Compliance'].map(item => (
                        <div key={item} className="text-sm font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
                            {item}
                        </div>
                    ))}
                </nav>
                <div className="pt-6 border-t border-black/5">
                    <div className="text-xs font-bold opacity-40">BUILT BY MD ARSH EQBAL</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Creatorly Dashboard</h1>
                        <p className="text-foreground/50 font-medium">Monitoring your storefront performance across Bharat</p>
                    </div>
                    <button className="btn-enterprise">Live Preview Store</button>
                </header>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map(stat => (
                        <div key={stat.label} className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-2">{stat.label}</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-extrabold tracking-tighter">{stat.value}</span>
                                <span className="text-xs font-bold text-secondary">{stat.change}</span>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Recent Transactions & Customer Map Placeholder */}
                <section className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Recent Indian Orders</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-sm">Customer #{i + 1240}</p>
                                        <p className="text-[10px] opacity-40 uppercase font-bold">Mumbai • UPI Completed</p>
                                    </div>
                                    <span className="font-extrabold text-sm">₹{899 * i}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📍</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Bharat Delivery Map</h3>
                        <p className="text-sm text-foreground/40 max-w-xs">
                            Real-time heat-map of where your customers are purchasing from in Tier 1, 2, and 3 cities.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
