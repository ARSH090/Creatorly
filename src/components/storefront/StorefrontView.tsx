'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Globe, Instagram, Twitter } from 'lucide-react';

interface StorefrontViewProps {
  creator: {
    _id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
  products: Array<{
    _id: string;
    title: string;
    description?: string;
    price: number;
    slug: string;
    coverImageUrl?: string;
    productType: string;
  }>;
}

export default function StorefrontView({ creator, products }: StorefrontViewProps) {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Creator Header */}
        <div className="text-center mb-12">
          {creator.avatar && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/10">
              <Image
                src={creator.avatar}
                alt={creator.displayName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{creator.displayName}</h1>
          {creator.bio && (
            <p className="text-zinc-400 max-w-md mx-auto mb-4">{creator.bio}</p>
          )}
          
          {/* Social Links */}
          <div className="flex justify-center gap-4">
            {creator.socialLinks?.instagram && (
              <a
                href={creator.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Instagram size={20} />
              </a>
            )}
            {creator.socialLinks?.twitter && (
              <a
                href={creator.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Twitter size={20} />
              </a>
            )}
            {creator.socialLinks?.website && (
              <a
                href={creator.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Globe size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/${creator.username}/${product.slug}`}
              className="group bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
            >
              {product.coverImageUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={product.coverImageUrl}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
                  {product.productType.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold mt-1 mb-2 group-hover:text-indigo-400 transition-colors">
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">₹{product.price}</span>
                  <span className="text-sm text-zinc-500 group-hover:text-white transition-colors">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500">No products available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
