import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Mutual Fund Tracker & Financial Calculator | BitAndBots by Sachin Khoja - Complete Investment Analysis Platform",
  description: "Comprehensive mutual fund tracker and financial calculator platform by Sachin Khoja at BitAndBots. Track SIP returns, analyze historical performance, XIRR calculator, target SIP calculator, portfolio tracking, and complete investment planning tools for custom duration analysis.",
  keywords: [
    "mutual fund calculator",
    "SIP calculator", 
    "XIRR calculator",
    "target SIP calculator",
    "mutual fund tracker",
    "investment calculator",
    "portfolio tracker",
    "SIP return calculator",
    "financial calculator",
    "investment planning",
    "fund performance tracker",
    "historical performance analysis",
    "mutual fund SIP returns",
    "investment portfolio analysis",
    "financial planning tools",
    "mutual fund investment tracker",
    "SIP tracking platform",
    "custom duration SIP analysis",
    "fund performance comparison",
    "investment goal calculator",
    "retirement planning calculator",
    "wealth management tools",
    "Nifty index tracker",
    "equity fund analysis",
    "debt fund calculator",
    "systematic investment plan",
    "lumpsum investment calculator",
    "compound annual growth rate",
    "BitAndBots",
    "Sachin Khoja",
    "customizable investment platform",
    "portfolio tracking tools",
    "financial dashboard",
    "investment analytics"
  ].join(", "),
  authors: [
    { name: "Sachin Khoja", url: "https://bitandbots.com" }
  ],
  creator: "Sachin Khoja",
  publisher: "BitAndBots",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bitandbots.com/finance',
    siteName: 'BitAndBots Financial Tools',
    title: 'Mutual Fund Tracker & SIP Calculator | Complete Investment Analysis Platform',
    description: 'Track mutual fund performance, calculate SIP returns, analyze portfolio with XIRR calculator, target SIP planner, and comprehensive financial tools by Sachin Khoja at BitAndBots.',
    images: [
      {
        url: '/finance/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Mutual Fund Tracker and Financial Calculator Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitandbots',
    creator: '@sachinkhoja',
    title: 'Mutual Fund Tracker & SIP Calculator | BitAndBots Financial Tools',
    description: 'Comprehensive platform for tracking mutual fund performance, SIP returns calculation, portfolio analysis, and investment planning tools.',
    images: ['/finance/twitter-card.jpg'],
  },
  category: 'finance',
  classification: 'Investment Tools, Financial Calculators, Portfolio Management',
  manifest: "/finance/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mutual Fund Tracker - BitAndBots"
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: 'https://bitandbots.com/finance',
  },
  other: {
    'application-name': 'BitAndBots Financial Tools',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/finance/browserconfig.xml',
    'google-site-verification': 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="canonical" href="https://finance.bitandbots.com" />
        
        {/* Additional SEO meta tags */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Mutual Fund Tracker & Financial Calculator",
              "url": "https://finance.bitandbots.com",
              "description": "Comprehensive mutual fund tracking and financial calculator platform for SIP returns, portfolio analysis, and investment planning",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web Browser",
              "author": {
                "@type": "Person",
                "name": "Sachin Khoja",
                "url": "https://bitandbots.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "BitAndBots",
                "url": "https://bitandbots.com"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "featureList": [
                "Mutual Fund Performance Tracking",
                "SIP Return Calculator",
                "XIRR Calculator",
                "Target SIP Calculator", 
                "Portfolio Analysis",
                "Nifty Index Tracker",
                "Historical Performance Analysis",
                "Investment Planning Tools",
                "Custom Duration Analysis",
                "Financial Dashboard"
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
