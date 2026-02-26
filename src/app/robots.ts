import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/pricing',
                    '/blog',
                    '/blog/',
                ],
                disallow: [
                    '/dashboard/',
                    '/admin/',
                    '/onboarding/',
                    '/api/',
                    '/checkout/',
                    '/auth/',
                    '/_next/',
                ],
            },
            // Block AI scrapers from indexing creator content
            {
                userAgent: 'GPTBot',
                disallow: ['/'],
            },
            {
                userAgent: 'CCBot',
                disallow: ['/'],
            },
        ],
        sitemap: 'https://creatorly.link/sitemap.xml',
        host: 'https://creatorly.link',
    };
}
