import { connectToDatabase } from '@/lib/db/mongodb';
export const dynamic = 'force-dynamic';
import Order from '@/lib/models/Order';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ExternalLink, Sparkles, ChevronRight, History } from 'lucide-react';
import DownloadButton from '@/components/delivery/DownloadButton';

export default async function DownloadsPage() {
    const user = await getCurrentUser();

    // In a real app, we search by user ID or session email
    // For this MVP, we'll fetch recent successful orders (if any)
    await connectToDatabase();
    const orders = await Order.find({
        status: 'success',
        customerEmail: user?.email // Simple filter for demo
    }).sort({ createdAt: -1 });

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                            <Sparkles size={14} className="fill-indigo-400" />
                            My Collection
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                            Library & Downloads
                        </h1>
                    </div>
                    <Link href="/dashboard" className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all">
                        < ChevronRight size={20} />
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] space-y-6">
                        <Package size={48} className="mx-auto text-zinc-700" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-white">No products found</h3>
                            <p className="text-sm">Once you purchase a product, it will appear here for download.</p>
                        </div>
                        <Link href="/" className="inline-block px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {orders.map((order) => (
                            <div key={order._id.toString()} className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 group hover:border-indigo-500/30 transition-all">
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    {/* Order Thumbnail List */}
                                    <div className="flex -space-x-4">
                                        {order.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden border-4 border-[#030303] shadow-2xl">
                                                <Image src={(item as any).image || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Details */}
                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div>
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Order #{order._id.toString().slice(-6)}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-white line-clamp-1 italic">
                                                {order.items.map(i => i.name).join(', ')}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                                <History size={14} className="text-indigo-500" />
                                                {order.downloadCount} / {order.downloadLimit} Downloads Used
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3">
                                        {order.items.map((item) => (
                                            <DownloadButton
                                                key={item.productId.toString()}
                                                orderId={order._id.toString()}
                                                productId={item.productId.toString()}
                                                fileName={item.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Secure Footer */}
                <div className="text-center pt-8 border-t border-white/5 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">Protected by Anti-Gravity Delivery Protocol</p>
                    <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                        <div className="text-[10px] font-bold">SHA-256 Encryption</div>
                        <div className="text-[10px] font-bold">JWT Protected</div>
                        <div className="text-[10px] font-bold">IP Binding</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
