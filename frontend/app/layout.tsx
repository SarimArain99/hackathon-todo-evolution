import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Todo Evolution — Plan your day. Get things done.",
    template: "%s | Todo Evolution",
  },
  description:
    "Todo Evolution is a simple to-do list app. Create tasks, set priorities and due dates, and filter by today, this week, or this month.",
  keywords: ["todo", "to-do list", "task management", "productivity"],
  authors: [{ name: "Muhammad Sarim", url: "https://github.com/SarimArain99" }],
  metadataBase: new URL("https://zenith-flow-zeta.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zenith-flow-zeta.vercel.app",
    title: "Todo Evolution — Plan your day. Get things done.",
    description:
      "A simple to-do list app. Create tasks, set priorities and due dates, and filter by today, this week, or this month.",
    siteName: "Todo Evolution",
  },
  twitter: {
    card: "summary",
    title: "Todo Evolution",
    description:
      "A simple to-do list app. Create tasks, set priorities and due dates, and filter by today, this week, or this month.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${outfit.variable}
          ${jetbrainsMono.variable}
          ${dmSerif.variable}
          antialiased
        `}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="relative flex min-h-screen flex-col">{children}</div>

          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "var(--font-outfit)",
                color: "var(--foreground)",
              },
            }}
          />
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  );
}
