import type { Metadata } from "next";
import { Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// Global inter font
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://creatorly.in'),
  title: {
    default: 'Creatorly — India\'s Creator Commerce Platform',
    template: '%s | Creatorly',
  },
  description: 'Sell digital products, automate Instagram DMs, build your storefront, and grow your audience. India\'s most complete creator platform with INR payments.',
  keywords: ['creator economy India', 'sell digital products India', 'link in bio India', 'Instagram automation', 'creator platform'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://creatorly.in',
    siteName: 'Creatorly',
    title: 'Creatorly — India\'s Creator Commerce Platform',
    description: 'Sell digital products, automate Instagram DMs, build your storefront.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Creatorly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creatorly — India\'s Creator Commerce Platform',
    description: 'Sell digital products, automate Instagram DMs, build your storefront.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

import { ClerkProvider } from "@clerk/nextjs";

import ClientLayout from '@/components/layout/ClientLayout';
import ErrorBoundary from './error-boundary';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import SyncUser from "@/components/auth/SyncUser";

import { PostHogProvider } from "./posthog-provider";
import SessionMonitor from "@/components/auth/SessionMonitor";
import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://graph.facebook.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={`${inter.variable} ${inter.className} antialiased bg-[#020617] text-slate-50`} data-suppress-hydration-warning="true">
        <ClerkProvider>
          <PostHogProvider>
            <QueryProvider>
              <ErrorBoundary>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </ErrorBoundary>
            </QueryProvider>
            <SpeedInsights />
            <Analytics />
          </PostHogProvider>
          <SyncUser />
          <SessionMonitor />
        </ClerkProvider>
      </body>
    </html>
  );
}

