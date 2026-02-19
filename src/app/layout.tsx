import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

import { ClerkProvider } from "@clerk/nextjs";

import ClientLayout from '@/components/layout/ClientLayout';
import ErrorBoundary from './error-boundary';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import SyncUser from "@/components/auth/SyncUser";

import { PostHogProvider } from "./posthog-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <SyncUser />
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
          <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
          <link rel="dns-prefetch" href="https://graph.facebook.com" />
          <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

          <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} data-suppress-hydration-warning="true">
          <PostHogProvider>
            <ErrorBoundary>
              <ClientLayout>
                {children}
              </ClientLayout>
            </ErrorBoundary>
            <SpeedInsights />
            <Analytics />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

