import type { Metadata } from "next";
import { StudioShell } from "./studio-shell";

export const metadata: Metadata = {
  title: "AI Video Generation Platform",
  description:
    "Generate premium images and cinematic AI videos with credit packs and Shopify checkout readiness.",
  other: {
    "shopify-integration": "checkout-ready",
  },
};

export default function Home() {
  return <StudioShell />;
}
