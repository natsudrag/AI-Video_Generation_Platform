import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "MotionForge AI — AI Video Generation Platform";
const siteDescription =
  "Create cinematic AI video with a media-first studio, premium model selection, and Shopify-ready credits.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "ai-video-generation-platform.k-micheal01.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;
  const previewImage = `${origin}/og.png`;

  return {
    title: siteTitle,
    description: siteDescription,
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "MotionForge AI",
      description: siteDescription,
      siteName: "MotionForge AI",
      type: "website",
      url: origin,
      images: [
        {
          url: previewImage,
          width: 1600,
          height: 900,
          alt: "MotionForge AI video generation platform preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "MotionForge AI",
      description: siteDescription,
      images: [previewImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
