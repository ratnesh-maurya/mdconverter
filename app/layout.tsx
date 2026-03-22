import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = "https://mdconverter.ratnesh-maurya.com";
const AUTHOR = "Ratnesh Maurya";
const TWITTER = "@ratnesh_maurya_";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MD Converter — Instant Text to Markdown Converter",
    template: "%s | MD Converter by Ratnesh Maurya",
  },
  description:
    "Paste any text — notes, docs, code, articles — and MD Converter instantly converts it into clean, structured Markdown. Real-time split preview, smart heading detection, code block recognition, table formatting, and one-click copy.",
  keywords: [
    "markdown converter",
    "text to markdown",
    "markdown editor",
    "markdown viewer",
    "markdown preview",
    "online markdown",
    "markdown live preview",
    "paste to markdown",
    "developer tools",
    "ratnesh maurya",
    "md converter",
    "mdconverter",
    "markdown formatter",
    "markdown generator",
  ],
  authors: [{ name: AUTHOR, url: "https://www.ratnesh-maurya.com" }],
  creator: AUTHOR,
  publisher: AUTHOR,
  category: "Developer Tools",
  classification: "Productivity, Developer Tools",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "MD Converter",
    title: "MD Converter — Instant Text to Markdown Converter",
    description:
      "Paste any text and watch it become beautiful Markdown instantly. Live split preview, smart code detection, tables, lists, headings — all automatically.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "MD Converter – Text to Markdown converter by Ratnesh Maurya",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER,
    creator: TWITTER,
    title: "MD Converter — Instant Text to Markdown Converter",
    description:
      "Paste any text and get Markdown instantly. Real-time preview, smart detection, one-click copy.",
    images: [OG_IMAGE],
  },
  manifest: "/manifest.json",
  other: {
    "application-name": "MD Converter",
    "msapplication-TileColor": "#7c3aed",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // ── Structured Data ──────────────────────────────────────────────────────

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: "MD Converter",
    alternateName: ["MDConverter", "Markdown Converter", "Text to Markdown", "MD Maker"],
    description:
      "Free online tool that converts plain text, notes, code snippets, and documents into clean Markdown. Features real-time split preview, smart heading detection, code block recognition, table formatting, and one-click copy.",
    url: SITE_URL,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Text Editor",
    operatingSystem: "Any (Web Browser)",
    browserRequirements: "Requires JavaScript. Works in Chrome, Firefox, Safari, Edge.",
    inLanguage: "en",
    isAccessibleForFree: true,
    isFamilyFriendly: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Real-time text to Markdown conversion",
      "Live split-pane preview",
      "Smart heading level detection",
      "Automatic code block detection with language hints",
      "Bullet and numbered list formatting",
      "Table detection and formatting",
      "Blockquote recognition",
      "Task list support",
      "URL and email auto-linking",
      "File path inline code formatting",
      "One-click Markdown copy",
      "Download as .md file",
      "Dark and light theme",
      "Keyboard shortcuts (Cmd/Ctrl+V)",
      "Collapsible raw Markdown panel",
      "Word, character, and line count",
      "Progressive Web App support",
    ],
    screenshot: OG_IMAGE,
    creator: {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR,
      url: "https://www.ratnesh-maurya.com",
      sameAs: [
        "https://twitter.com/ratnesh_maurya_",
        "https://github.com/ratnesh-maurya",
        "https://blog.ratnesh-maurya.com",
      ],
    },
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#author`,
    name: AUTHOR,
    url: "https://www.ratnesh-maurya.com",
    jobTitle: "Software Engineer",
    description: "Backend and systems engineer building developer tools and open-source software.",
    sameAs: [
      "https://twitter.com/ratnesh_maurya_",
      "https://github.com/ratnesh-maurya",
      "https://blog.ratnesh-maurya.com",
      "https://www.ratnesh-maurya.com",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "MD Converter",
    url: SITE_URL,
    inLanguage: "en",
    publisher: {
      "@id": `${SITE_URL}/#author`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is MD Converter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MD Converter is a free online tool that automatically converts plain text into Markdown format. Paste any text — notes, articles, code, documents — and it instantly detects headings, lists, code blocks, tables, and more.",
        },
      },
      {
        "@type": "Question",
        name: "How do I convert text to Markdown?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply paste your text into the editor on the left side, or press Cmd+V (Mac) / Ctrl+V (Windows) anywhere on the page. The Markdown output appears in real time on the right side.",
        },
      },
      {
        "@type": "Question",
        name: "Is MD Converter free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MD Converter is completely free to use with no account required.",
        },
      },
      {
        "@type": "Question",
        name: "Can MD Converter detect code blocks automatically?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MD Converter detects JSON, TypeScript, JavaScript, Python, Bash, CSS, HTML, YAML, and more. It wraps code in fenced code blocks with the correct language label.",
        },
      },
      {
        "@type": "Question",
        name: "Can I download the converted Markdown?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Click the download button to save the converted Markdown as a .md file.",
        },
      },
    ],
  };

  const schemaList = [webAppSchema, personSchema, websiteSchema, breadcrumbSchema, faqSchema];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        {schemaList.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
