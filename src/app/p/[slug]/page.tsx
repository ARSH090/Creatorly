import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProductGallery from '@/components/product/ProductGallery';
import PriceDisplay from '@/components/product/PriceDisplay';
import AddToCartButton from '@/components/product/AddToCartButton';
import RelatedProducts from '@/components/product/RelatedProducts';
import { ChevronRight, Share2, Twitter, Linkedin, Link as LinkIcon, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ISR every 60 seconds (CTO Hardening)
export const revalidate = 60;

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getProductData(slug: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products/slug/${slug}`, {
        next: { revalidate: 86400 } // Cache for 24h
    });

    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getProductData(slug);
    if (!data) return { title: 'Product Not Found' };

    const { product, creator } = data;
    return {
        title: `${product.name} | ${creator.displayName} on Creatorly`,
        description: product.description.substring(0, 160),
        openGraph: {
            title: product.name,
            description: product.description,
            images: [product.image],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description,
            images: [product.image],
        }
    };
}

// Generate static params for common products (Optional)
export async function generateStaticParams() {
    return []; // Let them be dynamic at build time to avoid worker exit
}

export default async function ProductPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const data = await getProductData(slug);

    if (!data) notFound();

    const { product, creator, relatedProducts } = data;

    // JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image,
        description: product.description,
        brand: {
            '@type': 'Brand',
            name: creator.displayName
        },
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.currency,
            availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-100">
            {/* JSON-LD injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight size={10} />
                    <Link href={`/${creator.username}`} className="hover:text-white transition-colors">{creator.storeName}</Link>
                    <ChevronRight size={10} />
                    <span className="text-zinc-200">Product</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Left: Media Gallery */}
                    <ProductGallery mainImage={product.image} files={product.files} />

                    {/* Right: Product Info */}
                    <div className="space-y-10 lg:sticky lg:top-8">

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    {product.type}
                                </span>
                                <div className="flex gap-4 text-zinc-500">
                                    <button className="hover:text-white transition-colors"><Twitter size={16} /></button>
                                    <button className="hover:text-white transition-colors"><Linkedin size={16} /></button>
                                    <button className="hover:text-white transition-colors"><LinkIcon size={16} /></button>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                                {product.name}
                            </h1>
                        </div>

                        <PriceDisplay
                            price={product.price}
                            compareAtPrice={product.compareAtPrice}
                            currency={product.currency}
                            productName={product.name}
                        />

                        <AddToCartButton productId={product._id} productName={product.name} />

                        <div className="space-y-6 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-3xl">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500">
                                    <Image src={creator.avatar || '/placeholder-avatar.png'} alt={creator.displayName} fill className="object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">{creator.displayName}</h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 italic">Creator of {creator.storeName}</p>
                                </div>
                                <Link
                                    href={`/${creator.username}`}
                                    className="ml-auto p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                                >
                                    <ChevronRight size={20} />
                                </Link>
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                                <ReactMarkdown>{product.description}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                <RelatedProducts products={relatedProducts} />

            </main>
        </div>
    );
}
