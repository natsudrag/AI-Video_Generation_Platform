import type { Metadata } from "next";
import { StudioShell } from "./studio-shell";

export const metadata: Metadata = {
  title: "MotionForge AI — AI Video Generation Platform",
  description:
    "Create cinematic AI video with a media-first studio, premium model selection, and Shopify-ready credits.",
  other: {
    "shopify-integration": "checkout-ready",
  },
};

export default function Home() {
  return <StudioShell />;
}
