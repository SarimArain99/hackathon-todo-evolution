/**
 * Zenith Root Layout
 * Production-ready architecture with smooth theme transitions and optimized SEO.
 */

import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// --- FONT OPTIMIZATION ---
// Using Outfit as the primary display/body font for that "Ethereal" look
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

// --- VIEWPORT CONFIGURATION ---
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C10" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents accidental zooming on mobile inputs for a more "App-like" feel
};

// --- SEO OPTIMIZED METADATA ---
export const metadata: Metadata = {
  title: {
    default: "Zenith | Next-Gen Productivity",
    template: "%s | Zenith"
  },
  description: "Master your productivity with Zenith. An advanced task management suite designed for flow-state focus.",
  keywords: ["Task Management", "Productivity", "AI Workflow", "Flow State", "Zenith OS"],
  authors: [{ name: "Zenith Team" }],
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
          antialiased 
          bg-background 
          text-foreground 
          selection:bg-primary/20 
          selection:text-primary
          transition-colors 
          duration-500
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false} // Set to false to allow our custom smooth CSS transitions
        >
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          
          <Toaster 
            position="top-center" 
            expand={false}
            richColors 
            closeButton
            toastOptions={{
              style: {
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                color: 'var(--foreground)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--glass-shadow)',
              },
            }}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}