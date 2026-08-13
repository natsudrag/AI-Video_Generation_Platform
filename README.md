# AI Video Generation Platform

A fresh AI video and image generation platform built for a premium creator
experience. The first screen is the working studio surface: prompt controls,
reference upload flow, model and quality tiers, preview state, library, credit
packs, Shopify checkout readiness, and launch checklist.

## Stack

- Vinext / Next app router on Cloudflare Workers
- React 19
- Tailwind CSS 4 with custom app styling
- Shopify Storefront cart route for credit-pack checkout
- Shopify webhook verification scaffold for order completion events

## Quick Start

```bash
npm install
npm run dev
npm run build
npm test
```

## Shopify Setup

Copy `.env.example` to `.env.local`, then fill in the store values:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_CREDIT_VARIANT_STARTER=gid://shopify/ProductVariant/...
SHOPIFY_CREDIT_VARIANT_CREATOR=gid://shopify/ProductVariant/...
SHOPIFY_CREDIT_VARIANT_STUDIO=gid://shopify/ProductVariant/...
```

Use public or private Storefront API access for cart creation. Private tokens
must stay server-side. The UI posts credit-pack purchases to
`/api/shopify/cart`, which creates a Shopify cart and returns the checkout URL
when the environment is configured.

For purchase fulfillment, point Shopify order webhooks at:

```text
/api/shopify/webhooks/orders
```

The webhook endpoint verifies `X-Shopify-Hmac-Sha256` against the raw request
body before accepting the payload. The next production step is adding a durable
credit ledger so verified paid orders increment user balances idempotently.

## AI Provider Setup

The UI currently runs in mock mode while the product and commerce shell come
together. The env template includes provider slots for Replicate, fal, Runware,
and OpenAI so free or lower-cost model routing can be added behind one provider
adapter without reshaping the interface.

## Important Files

- `app/studio-shell.tsx`: creator workspace UI and interaction flow
- `app/globals.css`: Spotify-inspired transparent visual system and animations
- `app/lib/shopify.ts`: Shopify config, cart creation, and webhook HMAC helper
- `app/api/shopify/cart/route.ts`: credit-pack checkout endpoint
- `app/api/shopify/webhooks/orders/route.ts`: verified order webhook endpoint
- `.env.example`: Shopify and AI provider configuration template
