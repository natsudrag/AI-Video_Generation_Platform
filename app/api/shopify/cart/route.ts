import {
  createCreditCart,
  getMissingShopifyKeys,
  getShopifyConfig,
  ShopifySetupError,
  type CreditPackageId,
} from "@/app/lib/shopify";

const packageIds = new Set<CreditPackageId>(["starter", "creator", "studio"]);

export async function GET() {
  const config = getShopifyConfig();
  const missing = getMissingShopifyKeys(config);

  return Response.json({
    connected: missing.length === 0,
    missing,
    storeDomain: config.storeDomain ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { packageId?: CreditPackageId };
    const packageId = payload.packageId;

    if (!packageId || !packageIds.has(packageId)) {
      return Response.json(
        { error: "A valid credit package is required." },
        { status: 400 },
      );
    }

    const cart = await createCreditCart(packageId);
    return Response.json(cart, { status: 201 });
  } catch (error) {
    if (error instanceof ShopifySetupError) {
      return Response.json(
        {
          setupRequired: true,
          missing: error.missing,
          error: "Shopify checkout is ready but needs environment variables.",
        },
        { status: 501 },
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
