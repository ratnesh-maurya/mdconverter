import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://mdconverter.ratnesh-maurya.com"),
  title: "MDConverter - Transform Text to Markdown Instantly",
  description: "Instantly transform any text into beautiful markdown. Just paste and watch the magic happen. Smart detection for headings, lists, and formatting.",
  keywords: ["markdown", "converter", "text", "formatting", "developer tools"],
  authors: [{ name: "MDConverter" }],
  creator: "MDConverter",
  publisher: "MDConverter",
  robots: "index, follow",
  openGraph: {
    title: "MDConverter - Transform Text to Markdown Instantly",
    description: "Instantly transform any text into beautiful markdown. Just paste and watch the magic happen.",
    type: "website",
    locale: "en_US",
    url: "https://mdconverter.ratnesh-maurya.com",
    siteName: "MDConverter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MDConverter - Transform Text to Markdown Instantly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MDConverter - Transform Text to Markdown Instantly",
    description: "Instantly transform any text into beautiful markdown. Just paste and watch the magic happen.",
    images: ["/og-image.png"],
    creator: "@ratnesh_maurya_",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MDConverter",
    description: "Instantly transform any text into beautiful markdown. Just paste and watch the magic happen.",
    url: "https://mdconverter.ratnesh-maurya.com",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "MDConverter Team",
    },
    featureList: [
      "Instant text to markdown conversion",
      "Smart detection for headings and lists",
      "One-click copy functionality",
      "Platform-specific keyboard shortcuts",
      "Progressive Web App support"
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
