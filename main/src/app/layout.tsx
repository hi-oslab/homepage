import type { Metadata } from "next";
import { METADATA } from "./metadata";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { pretendard } from "@/theme/font";
import "@/styles/globals.css";
import { Layout } from "@/components";

export const metadata: Metadata = {
  alternates: {
    canonical: METADATA.url,
  },
  title: {
    default: METADATA.title,
    template: METADATA.titleTemplate,
  },
  description: METADATA.description,
  keywords: METADATA.keywords,
  authors: METADATA.authors,
  creator: METADATA.authors[0].name,
  publisher: METADATA.authors[0].name,
  manifest: "/manifest.json",
  generator: METADATA.authors[0].name,
  applicationName: METADATA.name,
  appleWebApp: {
    capable: true,
    title: METADATA.title,
    // startUpImage: [],
  },
  category: "webapp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: METADATA.name,
    title: {
      default: METADATA.title,
      template: METADATA.titleTemplate,
    },
    description: METADATA.description,
    locale: "ko_KR",
    url: METADATA.url,
    images: {
      url: "/icons/op-image.png",
    },
  },
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: {
      rel: "mask-icon",
      url: "/icons/safari-pinned-tab.svg",
      color: "#000000",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.variable} antialiased`}>
        <Layout>{children}</Layout>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </html>
  );
}
