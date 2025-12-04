import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lava Wallet",
  description: "Your community wallet for LAVA — stake, track, and connect to DeFi",
  keywords: ["LAVA", "wallet", "crypto", "DeFi", "staking", "Web3"],
  authors: [{ name: "Lava Network" }],
  creator: "Lava Network",
  publisher: "Lava Network",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lava Wallet",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Lava Wallet",
    title: "Lava Wallet",
    description: "Your community wallet for LAVA — stake, track, and connect to DeFi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lava Wallet",
    description: "Your community wallet for LAVA — stake, track, and connect to DeFi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05090F",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/lava-brand-kit/logos/logo-icon-color.png" />
        <link rel="apple-touch-icon" href="/lava-brand-kit/logos/logo-symbol-color.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
