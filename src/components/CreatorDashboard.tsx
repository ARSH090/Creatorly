"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [view, setView] = useState<'analytics' | 'products'>('analytics');
    const [myProducts, setMyProducts] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Digital Goods',
        type: 'Digital Goods',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=3474&auto=format&fit=crop'
    });

    useEffect(() => {
        if (session?.user) {
            // If user has a temporary ID (user_xxxx), redirect to setup
            if (session.user.username?.startsWith('user_')) {
                router.push('/setup/url-path');
                return;
            }

            fetch('/api/products')
                .then(res => res.json())
                .then(data => setMyProducts(data))
                .catch(err => console.error(err));
        }
    }, [session, router]);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price)
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMyProducts([data, ...myProducts]);
                setShowAddModal(false);
                setNewProduct({
                    name: '',
                    description: '',
                    price: '',
                    category: 'Digital Goods',
                    type: 'Digital Goods',
                    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=3474&auto=format&fit=crop'
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const stats = [
        { label: 'Total Revenue', value: '₹12,45,000', change: '+12.5% 📈' },
        { label: 'Active Customers', value: '4,520', change: '+5% 🇮🇳' },
        { label: 'Order Velocity', value: '8.4/hr', change: 'Stable' },
    ];

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden flex">
            {/* Background Noise & Grid */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Sidebar */}
            <aside className="w-72 bg-[#050505] border-r border-white/5 p-8 hidden lg:flex flex-col relative z-10">
                <div className="flex items-center gap-2 group mb-12">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-black">C</div>
                    <span className="text-xl font-bold text-white tracking-tight">Creatorly</span>
                </div>

                <nav className="space-y-1 flex-1">
                    {[
                        { id: 'analytics', label: 'Infrastructure', icon: '📊' },
                        { id: 'products', label: 'Inventory', icon: '📦' },
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-all ${view === item.id
                                ? 'bg-white/5 text-white border border-white/8'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/2'
                                }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                    <div className="pt-8 mt-8 border-t border-white/5">
                        <div className="bg-indigo-500/5 p-6 rounded-4xl border border-indigo-500/10 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 blur-2xl rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Creatorly Elite</p>
                            <p className="text-xs font-medium text-zinc-400 mb-4 leading-relaxed">Scale to infinite products with 0% platform tax.</p>
                            <button className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Upgrade Now</button>
                        </div>
                    </div>
                </nav>

                <div className="pt-8 border-t border-white/5">
                    {session?.user && (
                        <div className="flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
                                <p className="text-[10px] text-zinc-600 font-medium truncate">@{session.user.username || 'creator'}</p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                title="Sign Out"
                            >
                                🚪
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative z-10 flex flex-col min-w-0">
                <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
                            Control Center <span className="text-zinc-600 mx-2">/</span>
                            <span className="text-zinc-400">{view === 'analytics' ? 'Infrastructure' : 'Inventory'}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {view === 'products' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="h-10 px-6 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                + New Offering
                            </button>
                        )}
                        <button className="h-10 px-6 bg-white/3 border border-white/8 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/6 transition-all">
                            Live Store
                        </button>
                    </div>
                </header>

                <div className="p-8 lg:p-12 overflow-y-auto flex-1">
                    <div className="max-w-6xl">
                        <div className="mb-12">
                            <h2 className="text-3xl lg:text-4xl font-medium tracking-tighter text-white mb-2">
                                Namaste, {session?.user?.name?.split(' ')[0] || 'Creator'}.
                            </h2>
                            <p className="text-zinc-500 font-medium">Your digital infrastructure is performing optimally.</p>
                        </div>

                        {view === 'analytics' ? (
                            <div className="space-y-12">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {stats.map(stat => (
                                        <div key={stat.label} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">{stat.label}</p>
                                            <div className="flex items-baseline justify-between gap-4">
                                                <span className="text-3xl font-medium tracking-tighter text-white">{stat.value}</span>
                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{stat.change}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chart Mockup placeholder */}
                                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] h-96 relative flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 10 5, 20 15 T 40 15 T 60 15 T 80 15 T 100 15' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundSize: '200px 40px' }} />
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Real-time Traffic Metrics</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myProducts.length === 0 ? (
                                    <div className="col-span-full py-32 text-center bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/10">
                                        <div className="text-4xl mb-6">📦</div>
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No active inventory found.</p>
                                        <button onClick={() => setShowAddModal(true)} className="mt-8 text-white font-bold text-xs hover:underline uppercase tracking-widest underline-offset-8">Deploy First Product</button>
                                    </div>
                                ) : (
                                    myProducts.map(product => (
                                        <div key={product._id} className="group bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] hover:border-white/10 transition-all flex flex-col h-full">
                                            <div className="w-full aspect-square bg-zinc-800/50 rounded-2xl mb-6 overflow-hidden relative">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                                                    ₹{product.price}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-white mb-2 leading-tight flex-1">{product.name}</h3>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{product.type}</span>
                                                <button className="text-indigo-400 hover:text-white transition-colors text-xl">↗</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6">
                    <div className="bg-[#080808] border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 md:p-16 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-3xl text-zinc-600 hover:text-white transition-colors">×</button>

                        <div className="mb-12">
                            <h2 className="text-3xl font-medium tracking-tight text-white mb-2">New Offering</h2>
                            <p className="text-zinc-500 text-sm">Deploy a new digital product to your storefront.</p>
                        </div>

                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Title</label>
                                <input
                                    required
                                    className="w-full bg-white/3 border border-white/8 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-bold text-white placeholder-zinc-700"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g. Masterclass on Content Design"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Valuation (INR)</label>
                                <input
                                    required type="number"
                                    className="w-full bg-white/3 border border-white/8 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-black text-white placeholder-zinc-700"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    placeholder="499"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Asset Class</label>
                                <select
                                    className="w-full bg-white/3 border border-white/8 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-bold text-white appearance-none cursor-pointer"
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value, type: e.target.value as any })}
                                >
                                    <option className="bg-[#080808]">Digital Goods</option>
                                    <option className="bg-[#080808]">Consultations</option>
                                    <option className="bg-[#080808]">Physical Goods</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Descriptor</label>
                                <textarea
                                    required
                                    className="w-full bg-white/3 border border-white/8 rounded-2xl px-6 py-4 h-32 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-medium text-white placeholder-zinc-700 resize-none"
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Briefly describe the value proposition..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="md:col-span-2 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-zinc-200 active:scale-95 transition-all shadow-white/5"
                            >
                                Deploy to Storefront
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
