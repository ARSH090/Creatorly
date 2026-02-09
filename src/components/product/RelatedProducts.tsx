'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface RelatedProductsProps {
    products: any[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="pt-12 border-t border-white/5 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">From the same creator</h3>
                <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                    View Store <ArrowRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Link
                        key={product._id}
                        href={`/p/${product.slug}`}
                        className="group space-y-4"
                    >
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-indigo-500/50 transition-all">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 left-3 right-3">
                                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                                    ₹{product.price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {product.name}
                            </h4>
                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">
                                {product.type}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
