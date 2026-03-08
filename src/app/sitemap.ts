import { MetadataRoute } from 'next'
import { connectToDatabase } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = 'https://creatorly.in'
    const staticPages: MetadataRoute.Sitemap = [
        { url: base, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${base}/pricing`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/features`, changeFrequency: 'monthly', priority: 0.8 },
    ]
    try {
        await connectToDatabase()
        const creators = await User.find({ username: { $exists: true, $ne: null } })
            .select('username updatedAt').lean().limit(10000)

        const creatorPages: MetadataRoute.Sitemap = (creators as any[]).map(c => ({
            url: `${base}/u/${c.username}`,
            lastModified: c.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        return [...staticPages, ...creatorPages]
    } catch {
        return staticPages
    }
}
