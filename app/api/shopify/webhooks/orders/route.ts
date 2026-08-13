import { verifyShopifyWebhook } from "@/app/lib/shopify";

export async function POST(request: Request) {
  const rawBody = await request.arrayBuffer();
  const isVerified = await verifyShopifyWebhook(
    rawBody,
    request.headers.get("x-shopify-hmac-sha256"),
  );

  if (!isVerified) {
    return Response.json(
      { error: "Invalid Shopify webhook signature." },
      { status: 401 },
    );
  }

  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const webhookId = request.headers.get("x-shopify-webhook-id");

  // Increment the credit ledger idempotently here once the database is added.
  return Response.json({
    accepted: true,
    topic,
    shopDomain,
    webhookId,
  });
}
