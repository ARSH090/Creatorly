"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function CreatorDashboard() {
    const { data: session } = useSession();
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
        if (session) {
            fetch('/api/products')
                .then(res => res.json())
                .then(data => setMyProducts(data))
                .catch(err => console.error(err));
        }
    }, [session]);

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
        <div className="min-h-screen bg-slate-50 flex text-slate-900">
            {/* Sidebar - Desktop Only */}
            <aside className="w-64 bg-white border-r border-black/5 p-6 hidden lg:flex flex-col">
                <h2 className="text-xl font-bold text-bharat-gradient mb-12 uppercase tracking-tighter">Creatorly</h2>
                <nav className="space-y-6 flex-1">
                    <div
                        onClick={() => setView('analytics')}
                        className={`text-sm font-bold cursor-pointer transition-opacity ${view === 'analytics' ? 'opacity-100 text-orange-600' : 'opacity-50'}`}
                    >
                        Analytics
                    </div>
                    <div
                        onClick={() => setView('products')}
                        className={`text-sm font-bold cursor-pointer transition-opacity ${view === 'products' ? 'opacity-100 text-orange-600' : 'opacity-50'}`}
                    >
                        Products
                    </div>
                    <div className="pt-8 flex-1">
                        <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                            <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Creatorly Pro</p>
                            <p className="text-xs font-medium text-orange-800 mb-3 leading-tight">Unlock unlimited products and 0% platform fees.</p>
                            <button className="w-full py-2 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-sm active:scale-95 transition-all">Upgrade Now</button>
                        </div>
                    </div>
                </nav>
                <div className="pt-6 border-t border-black/5">
                    {session?.user && (
                        <div className="mb-4">
                            <p className="text-sm font-bold truncate">{session.user.name}</p>
                            <button
                                onClick={() => signOut()}
                                className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Creatorly v1.0 • Enterprise</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Namaste, {session?.user?.name?.split(' ')[0] || 'Creator'}!
                        </h1>
                        <p className="text-foreground/50 font-medium">
                            {view === 'analytics' ? 'Monitoring your storefront performance across Bharat' : 'Manage your digital offerings'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {view === 'products' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-2 bg-orange-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-orange-700 transition-all"
                            >
                                + Add Product
                            </button>
                        )}
                        <button className="btn-enterprise">Live Preview Store</button>
                    </div>
                </header>

                {view === 'analytics' ? (
                    <>
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

                    </>
                ) : (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myProducts.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-4xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold">No products yet. Create your first one!</p>
                            </div>
                        ) : (
                            myProducts.map(product => (
                                <div key={product._id} className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                                    <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                    <p className="text-orange-600 font-extrabold">₹{product.price}</p>
                                    <p className="text-[10px] uppercase font-bold opacity-40 mt-2">{product.type}</p>
                                </div>
                            ))
                        )}
                    </section>
                )}
            </main>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-4xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">Add Digital Product</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-2xl opacity-40 hover:opacity-100 cursor-pointer">×</button>
                        </div>
                        <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase opacity-40 mb-2">Product Name</label>
                                <input
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-orange-600 transition-all font-bold"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="Enter product title"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold uppercase opacity-40 mb-2">Price (INR)</label>
                                <input
                                    required type="number"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-orange-600 transition-all font-extrabold"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    placeholder="999"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold uppercase opacity-40 mb-2">Category</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-orange-600 transition-all font-bold"
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value, type: e.target.value as any })}
                                >
                                    <option>Digital Goods</option>
                                    <option>Consultations</option>
                                    <option>Physical Goods</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase opacity-40 mb-2">Description</label>
                                <textarea
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 h-32 outline-none focus:ring-2 focus:ring-orange-600 transition-all font-medium"
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="What are you selling?"
                                />
                            </div>
                            <button
                                type="submit"
                                className="col-span-2 py-5 bg-orange-600 text-white rounded-3xl font-extrabold text-lg shadow-xl hover:bg-orange-700 active:scale-95 transition-all shadow-orange-600/20"
                            >
                                Launch Product 🚀
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
