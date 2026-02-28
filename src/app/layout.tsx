import type { Metadata } from "next";
import { Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// Global inter font
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Creatorly — The Operating System for Indian Creators",
    template: "%s | Creatorly"
  },
  description: "The all-in-one platform for Indian creators to manage stores, payments, and audience engagement with sub-second performance.",
  keywords: ["creator economy", "india", "ecommerce", "digital products", "monetization"],
  authors: [{ name: "Creatorly Team" }],
  icons: {
    icon: [
      { url: "/creatorly-logo.png" },
      { url: "/creatorly-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/creatorly-logo.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/creatorly-logo.png" }
    ],
    shortcut: ["/creatorly-logo.png"]
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://creatorly.in",
    siteName: "Creatorly",
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Creatorly Platform"
    }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@creatorly_in",
    creator: "@creatorly_in"
  },
  metadataBase: new URL("https://creatorly.in"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

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
    <ClerkProvider>
      <SyncUser />
      <SessionMonitor />
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
        <body className={`${inter.variable} ${inter.className} antialiased`} data-suppress-hydration-warning="true">
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
        </body>
      </html>
    </ClerkProvider>
  );
}

