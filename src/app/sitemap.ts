import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

const BASE_URL = 'https://creatorly.link';

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ];

    try {
        await connectToDatabase();

        // All published creator storefronts
        const creators = await User.find({
            status: { $ne: 'suspended' },
            onboardingComplete: true,
            username: { $exists: true, $ne: '' },
        })
            .select('username updatedAt')
            .lean() as any[];

        const storefrontPages: MetadataRoute.Sitemap = creators.map(creator => ({
            url: `${BASE_URL}/${creator.username}`,
            lastModified: creator.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }));

        // All active products with creator username (for clean /username/product-slug URLs)
        const products = await Product.find({
            status: 'active',
            slug: { $exists: true, $ne: '' },
        })
            .select('slug creatorId updatedAt')
            .populate({ path: 'creatorId', select: 'username', model: User })
            .lean() as any[];

        const productPages: MetadataRoute.Sitemap = products
            .filter((p: any) => p.creatorId?.username && p.slug)
            .map((p: any) => ({
                url: `${BASE_URL}/${p.creatorId.username}/${p.slug}`,
                lastModified: p.updatedAt || new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.8,
            }));

        return [...staticPages, ...storefrontPages, ...productPages];
    } catch (err) {
        console.error('Sitemap generation error:', err);
        return staticPages;
    }
}
