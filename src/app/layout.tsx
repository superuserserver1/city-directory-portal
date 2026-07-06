import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "CityDir - Your Complete City Business Directory | Find Businesses, Amenities & Services",
  description:
    "Discover the best businesses, amenities, restaurants, hospitals, schools, hotels, transport, and services in your city. Search by category, locality, or keyword. Complete local business directory with enquiry system.",
  keywords: [
    "city directory", "local business directory", "business listing", "amenities",
    "restaurants", "hospitals", "schools", "hotels", "shopping", "banks",
    "city guide", "local services", "business search", "find near me",
    "railway station", "airport", "swimming pool", "sports ground",
  ],
  authors: [{ name: "CityDir Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CityDir - Complete City Business Directory",
    description: "Find businesses, amenities, and services in your city. Your complete local directory.",
    siteName: "CityDir",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CityDir - City Business Directory",
    description: "Find businesses, amenities, and services in your city.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f766e" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}