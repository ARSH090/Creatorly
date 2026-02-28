/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // Allow production builds even if ESLint/TS warnings are present
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
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
        const isDev = process.env.NODE_ENV === 'development';
        const ContentSecurityPolicy = `
          default-src 'self';
          script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} 
            https://checkout.razorpay.com 
            https://apis.google.com 
            https://accounts.google.com 
            https://www.gstatic.com 
            https://*.clerk.com 
            https://*.clerk.accounts.dev 
            https://va.vercel-scripts.com;
          style-src 'self' 'unsafe-inline' 
            https://fonts.googleapis.com 
            https://*.clerk.com;
          font-src 'self' 
            https://fonts.gstatic.com 
            data:;
          img-src 'self' 
            data: 
            blob: 
            https: 
            http:;
          connect-src 'self' 
            https://*.clerk.com 
            https://*.clerk.accounts.dev 
            https://checkout.razorpay.com 
            https://api.razorpay.com 
            https://lottie.host 
            wss://*.clerk.com
            ${isDev ? 'ws://localhost:3000 http://localhost:3000' : ''};
          frame-src 'self' 
            https://checkout.razorpay.com 
            https://accounts.google.com 
            https://*.clerk.com 
            https://*.clerk.accounts.dev;
          worker-src 'self' blob:;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
        `.replace(/\s{2,}/g, ' ').trim();

        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: ContentSecurityPolicy
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")'
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'unsafe-none'
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'credentialless'
                    }
                ]
            },
            {
                source: '/_next/static/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            },
            {
                source: '/fonts/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            },
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
