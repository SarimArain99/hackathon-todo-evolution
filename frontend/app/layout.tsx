/**
 * Zenith Root Layout
 * Features: Optimized SEO Metadata, OpenGraph support, and Theme Integration.
 * Performance: Font preloading for faster LCP
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true, // Preload critical font
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Don't preload monospace - used less frequently
});

// --- SEO OPTIMIZED METADATA ---
export const metadata: Metadata = {
  title: {
    default: "Zenith | Next-Gen AI Task Management & Workflow Evolution",
    template: "%s | Zenith"
  },
  description: "Master your productivity with Zenith. An advanced task management suite designed for flow-state focus. Organize, prioritize, and crush your daily objectives seamlessly.",
  keywords: ["Task Management", "Productivity Tool", "Zenith App", "Workflow Optimization", "AI Todo List", "Flow State", "Modern Task Evolution"],
  authors: [{ name: "Zenith Team" }],
  creator: "Zenith Productivity",
  metadataBase: new URL("https://zenith-flow-zeta.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zenith-flow-zeta.vercel.app",
    title: "Zenith | Task Evolution",
    description: "Evolve your productivity with Zenith's advanced workflow management.",
    siteName: "Zenith",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith | Next-Gen Productivity",
    description: "The ultimate smart task management solution for high-achievers.",
    creator: "@zenith_app",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="no-scrollbar">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-gray-950 transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}