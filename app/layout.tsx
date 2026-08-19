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

const siteTitle = "AI Video Generation Platform";
const siteDescription =
  "A premium AI video and image generation studio with credits and Shopify checkout readiness.";

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
      title: "AOV Studio",
      description: siteDescription,
      siteName: "AOV Studio",
      type: "website",
      url: origin,
      images: [
        {
          url: previewImage,
          width: 1600,
          height: 900,
          alt: "AOV Studio AI Video Generation Platform preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AOV Studio",
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
