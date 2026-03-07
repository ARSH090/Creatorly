'use client';

import React, { useState, useEffect } from "react";
import { ChevronLeft, Save, Globe, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";

export default function ProductSetupPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/creator/products/${id}`);
                const data = await res.json();
                setProduct(data.product);
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!product) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Product Not Found</h2>
            <Link href="/dashboard/products" className="text-indigo-400 font-bold hover:underline">Return to Dashboard</Link>
        </div>
    );

    return (
        <div className="space-y-10 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link
                        href={`/dashboard/products/${id}`}
                        className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white transition-all group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{product.productType}</span>
                            <span className="text-zinc-700 font-bold">•</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.status}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tightest leading-tight uppercase italic">{product.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/p/${product.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                    >
                        <Globe className="w-4 h-4" />
                        Live Preview
                    </Link>
                </div>
            </div>

            {/* Form Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <ProductForm initialData={product} isEditing={true} />
            </motion.div>
        </div>
    );
}
