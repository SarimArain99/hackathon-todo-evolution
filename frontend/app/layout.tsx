import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#1e212b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Dayline — Plan your day. Get things done.",
    template: "%s | Dayline",
  },
  description:
    "Dayline is a simple, fast to-do app. Create tasks, set priorities and due dates, and check things off as you go.",
  keywords: ["todo", "to-do list", "task management", "productivity"],
  authors: [{ name: "Muhammad Sarim", url: "https://github.com/SarimArain99" }],
  metadataBase: new URL("https://dayline-todo.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dayline-todo.vercel.app",
    title: "Dayline — Plan your day. Get things done.",
    description:
      "Dayline is a simple, fast to-do app. Create tasks, set priorities and due dates, and check things off as you go.",
    siteName: "Dayline",
  },
  twitter: {
    card: "summary",
    title: "Dayline",
    description:
      "Dayline is a simple, fast to-do app. Create tasks, set priorities and due dates, and check things off as you go.",
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
          ${spaceGrotesk.variable}
          ${inter.variable}
          ${jetbrainsMono.variable}
          antialiased
        `}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
                fontFamily: "var(--font-inter)",
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
