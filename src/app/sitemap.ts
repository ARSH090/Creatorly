import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://creatorly.in';

    // 1. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
        { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    // 2. Dynamic Creator Storefronts
    try {
        await connectToDatabase();
        const creators = await CreatorProfile.find({}).select('username updatedAt').lean();

        const creatorRoutes: MetadataRoute.Sitemap = creators.map((creator: any) => ({
            url: `${baseUrl}/u/${creator.username}`,
            lastModified: creator.updatedAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        return [...staticRoutes, ...creatorRoutes];
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return staticRoutes;
    }
}
