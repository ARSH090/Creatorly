import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicProductClient from './PublicProductClient';

interface PageProps {
    params: Promise<{
        username: string;
        slug: string;
    }>;
    searchParams: Promise<{
        [key: string]: string | string[] | undefined;
    }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username, slug } = await params;
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/public/${username}/${slug}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return {
                title: 'Product Not Found',
                description: 'The requested product could not be found.'
            };
        }

        const data = await response.json();
        const { product, creator } = data;

        if (!product) {
            return {
                title: 'Product Not Found',
                description: 'The requested product could not be found.'
            };
        }

        const title = `${product.title} by ${creator.name}`;
        const description = product.description || product.tagline || `Discover ${product.title} by ${creator.name}. ${product.productType?.replace('_', ' ')} product available now.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                url: `${process.env.NEXT_PUBLIC_APP_URL}/${username}/${slug}`,
                images: product.coverImageUrl ? [{ url: product.coverImageUrl }] : [],
                siteName: 'Creatorly'
            }
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Digital Product',
            description: 'Discover amazing digital products on Creatorly'
        };
    }
}

// Server component to fetch initial data
async function getProductData(username: string, slug: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/public/${username}/${slug}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching product data:', error);
        return null;
    }
}

export default async function PublicProductPage({ params, searchParams }: PageProps) {
    const { username, slug } = await params;
    const sParams = await searchParams;

    const data = await getProductData(username, slug);

    if (!data?.product) {
        notFound();
    }

    // Extract URL parameters for checkout
    const email = typeof sParams.email === 'string' ? sParams.email : '';
    const coupon = typeof sParams.coupon === 'string' ? sParams.coupon : '';

    return (
        <PublicProductClient
            initialData={data}
            initialEmail={email}
            initialCoupon={coupon}
        />
    );
}
