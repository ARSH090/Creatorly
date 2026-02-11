import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
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
          // CSP: Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data:; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://checkout.razorpay.com https://api.razorpay.com; connect-src 'self' https://api.razorpay.com https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss: ws:;"
          },
          // X-Content-Type-Options: Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // X-Frame-Options: Clickjacking protection (ALLOW-FROM logic is better handled via frame-ancestors in CSP, but keeping DENY for general safety or switching to SAMEORIGIN if needed)
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
          // Permissions-Policy (formerly Feature-Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
