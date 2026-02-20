'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductEditor, { ProductFormData } from '@/components/dashboard/ProductEditor';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
    const params = useParams();
    const projectId = params?.projectId as string;
    const [product, setProduct] = useState<ProductFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products/${projectId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct({
                        ...data,
                        price: data.price?.toString() || '',
                        variants: data.variants || [],
                        hasVariants: data.hasVariants || false
                    });
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [projectId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!product) {
        return <div className="text-white text-center pt-20">Product not found.</div>;
    }

    return <ProductEditor initialData={product} />;
}
