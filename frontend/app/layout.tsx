/**
 * Zenith Root Layout - V3.0 Precision Systems
 * Enhanced with GSAP context and custom glassmorphism components.
 */

import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// --- FONT OPTIMIZATION ---
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
});

// --- VIEWPORT CONFIGURATION ---
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e17" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// --- SEO OPTIMIZED METADATA ---
export const metadata: Metadata = {
  title: {
    default: "Zenith | Precision Productivity",
    template: "%s | Zenith"
  },
  description: "A high-performance task management suite engineered for sub-second flow states.",
  keywords: ["Task Management", "Productivity", "GSAP UI", "Glassmorphism", "Next.js 15"],
  authors: [{ name: "Zenith Precision Systems" }],
  metadataBase: new URL("https://zenith-flow-zeta.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zenith-flow-zeta.vercel.app",
    title: "Zenith | Design Your Productivity",
    description: "The ultimate programmatic interface for deep work.",
    siteName: "Zenith OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith OS",
    description: "Experience the next evolution of productivity tools.",
    creator: "@zenith_app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className="hide-scrollbar" 
      style={{ scrollBehavior: 'smooth' }}
    >
      <body
        className={`
          ${outfit.variable}
          ${jetbrainsMono.variable}
          ${dmSerif.variable}
          antialiased
          transition-colors
          duration-700
          noise-overlay
        `}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Defaulting to dark to showcase your #1E2A38 theme
          enableSystem
          disableTransitionOnChange={false}
        >
          {/* Main Content Wrapper */}
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            {children}
          </div>
          
          {/* Custom Sonner Toaster - Styled for Glassmorphism */}
          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              className: "glass-panel !bg-[var(--glass-bg)] !backdrop-blur-xl !border-[var(--glass-border)] !rounded-[var(--radius-2xl)] !p-4 !shadow-[var(--glass-shadow)]",
              style: {
                fontFamily: 'var(--font-outfit)',
                color: 'var(--foreground)',
              },
            }}
          />
        </ThemeProvider>
        
        <Analytics />
      </body>
    </html>
  );
}