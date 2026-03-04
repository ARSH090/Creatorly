'use client';

import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { motion } from "framer-motion";

export default function NewProductPage() {
    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link
                    href="/dashboard/products"
                    className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white transition-all group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tightest mb-2 italic uppercase">New Masterpiece</h1>
                    <p className="text-zinc-500 font-medium text-lg">Deploy a new digital asset to your global audience.</p>
                </div>
            </div>

            {/* Form Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <ProductForm />
            </motion.div>
        </div>
    );
}
