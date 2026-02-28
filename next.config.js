/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '**.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '**.s3.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '**.s3-ap-south-1.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
            {
                protocol: 'https',
                hostname: '**.clerk.com',
            },
            {
                protocol: 'https',
                hostname: '**.clerk.accounts.dev',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },
    // Next.js 14 compatible experimental features
    experimental: {
        serverComponentsExternalPackages: ['isomorphic-dompurify', 'jsdom'],
        optimizePackageImports: [
            'framer-motion',
            'lucide-react',
            '@radix-ui/react-icons',
            '@radix-ui/react-slot',
            'clsx',
            'tailwind-merge'
        ],
    },

    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // HSTS: Strict Transport Security
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    // CSP: Content Security Policy (tightened — removed unsafe-eval)
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.clerk.com https://*.clerk.accounts.dev https://va.vercel-scripts.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' https: data: https://img.clerk.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "frame-src 'self' https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com https://*.clerk.com https://*.clerk.accounts.dev",
                            "connect-src 'self' https://api.razorpay.com https://*.googleapis.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.vercel-analytics.com https://va.vercel-scripts.com wss: ws:",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; ')
                    },
                    // X-Content-Type-Options: Prevent MIME sniffing
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    // X-Frame-Options: Clickjacking protection
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    // X-XSS-Protection
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    // Referrer-Policy
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    // Permissions-Policy (restricted payment= to Razorpay only)
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")'
                    },
                    // Cross-Origin-Opener-Policy
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'unsafe-none'
                    },
                    // Cross-Origin-Embedder-Policy
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'credentialless'
                    }
                ]
            },
            // Static assets — immutable cache (1 year)
            {
                source: '/_next/static/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            },
            // Font files — long cache
            {
                source: '/fonts/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            },
            // Public images — cache for 1 hour
            {
                source: '/images/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }
                ]
            }
        ];
    },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig);
