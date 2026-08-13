# Shopify Setup

This build is ready for Shopify checkout, but it needs your live store values
before purchases can redirect to a real checkout.

## 1. Create Credit Products

In Shopify, create one product for AI credits or three separate products for the
packs:

- Starter - 120 credits
- Creator - 420 credits
- Studio - 1100 credits

Copy each product variant GID into `.env.local`.

## 2. Add Storefront API Access

Create Storefront API access for the store. Use either:

- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` for public Storefront API access.
- `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` for server-side private Storefront API access.

Private tokens should never be exposed in browser code. This app only reads
them from server routes.

## 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill these values:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_CREDIT_VARIANT_STARTER=gid://shopify/ProductVariant/...
SHOPIFY_CREDIT_VARIANT_CREATOR=gid://shopify/ProductVariant/...
SHOPIFY_CREDIT_VARIANT_STUDIO=gid://shopify/ProductVariant/...
```

## 4. Webhooks

Subscribe paid order events to:

```text
https://your-domain.com/api/shopify/webhooks/orders
```

The endpoint verifies `X-Shopify-Hmac-Sha256` before accepting a payload. The
next production task is adding a credit ledger table so repeated deliveries can
be ignored using `X-Shopify-Webhook-Id`.

## 5. What I Need From You To Connect It Live

- Shopify store domain, usually `your-store.myshopify.com`
- Storefront access token or private Storefront token
- Credit product variant GIDs
- Webhook secret or Shopify app client secret
