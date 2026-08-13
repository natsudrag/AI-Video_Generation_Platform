export const SHOPIFY_API_VERSION = "2026-07";

export type CreditPackageId = "starter" | "creator" | "studio";

export type ShopifyRuntimeConfig = {
  storeDomain?: string;
  storefrontAccessToken?: string;
  storefrontPrivateToken?: string;
  webhookSecret?: string;
  starterVariantId?: string;
  creatorVariantId?: string;
  studioVariantId?: string;
};

export type ShopifyCartResult = {
  checkoutUrl: string;
  cartId: string;
};

const CART_CREATE_MUTATION = `#graphql
mutation CreateCreditCart($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      totalQuantity
    }
    userErrors {
      field
      message
    }
    warnings {
      message
    }
  }
}`;

export function getShopifyConfig(): ShopifyRuntimeConfig {
  const runtimeEnv = getRuntimeEnv();

  return {
    storeDomain: runtimeEnv.SHOPIFY_STORE_DOMAIN,
    storefrontAccessToken: runtimeEnv.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    storefrontPrivateToken: runtimeEnv.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
    webhookSecret:
      runtimeEnv.SHOPIFY_WEBHOOK_SECRET ?? runtimeEnv.SHOPIFY_CLIENT_SECRET,
    starterVariantId: runtimeEnv.SHOPIFY_CREDIT_VARIANT_STARTER,
    creatorVariantId: runtimeEnv.SHOPIFY_CREDIT_VARIANT_CREATOR,
    studioVariantId: runtimeEnv.SHOPIFY_CREDIT_VARIANT_STUDIO,
  };
}

export function getMissingShopifyKeys(config = getShopifyConfig()): string[] {
  const missing: string[] = [];

  if (!config.storeDomain) missing.push("SHOPIFY_STORE_DOMAIN");
  if (!config.storefrontAccessToken && !config.storefrontPrivateToken) {
    missing.push(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN or SHOPIFY_STOREFRONT_PRIVATE_TOKEN",
    );
  }
  if (!config.starterVariantId) missing.push("SHOPIFY_CREDIT_VARIANT_STARTER");
  if (!config.creatorVariantId) missing.push("SHOPIFY_CREDIT_VARIANT_CREATOR");
  if (!config.studioVariantId) missing.push("SHOPIFY_CREDIT_VARIANT_STUDIO");

  return missing;
}

export function getVariantId(
  packageId: CreditPackageId,
  config = getShopifyConfig(),
): string | undefined {
  const variantIds: Record<CreditPackageId, string | undefined> = {
    starter: config.starterVariantId,
    creator: config.creatorVariantId,
    studio: config.studioVariantId,
  };

  return variantIds[packageId];
}

export async function createCreditCart(
  packageId: CreditPackageId,
): Promise<ShopifyCartResult> {
  const config = getShopifyConfig();
  const missing = getMissingShopifyKeys(config);
  const merchandiseId = getVariantId(packageId, config);

  if (missing.length > 0 || !config.storeDomain || !merchandiseId) {
    throw new ShopifySetupError(missing);
  }

  const endpoint = shopifyStorefrontEndpoint(config.storeDomain);
  const headers = storefrontHeaders(config);
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: CART_CREATE_MUTATION,
      variables: {
        input: {
          lines: [{ merchandiseId, quantity: 1 }],
          attributes: [
            { key: "source", value: "AI Video Generation Platform" },
            { key: "credit_package", value: packageId },
          ],
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: {
      cartCreate?: {
        cart?: { id: string; checkoutUrl: string };
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join("; ") ??
        `Shopify Storefront API returned ${response.status}`,
    );
  }

  const cart = payload.data?.cartCreate?.cart;
  const userErrors = payload.data?.cartCreate?.userErrors ?? [];

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join("; "));
  }

  if (!cart?.checkoutUrl) {
    throw new Error("Shopify did not return a checkout URL.");
  }

  return {
    checkoutUrl: cart.checkoutUrl,
    cartId: cart.id,
  };
}

export async function verifyShopifyWebhook(
  rawBody: ArrayBuffer,
  hmacHeader: string | null,
  secret = getShopifyConfig().webhookSecret,
): Promise<boolean> {
  if (!secret || !hmacHeader) return false;

  const signature = await hmacSha256Base64(rawBody, secret);
  return timingSafeEqual(signature, hmacHeader);
}

export class ShopifySetupError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super("Shopify is not fully configured.");
    this.name = "ShopifySetupError";
    this.missing = missing;
  }
}

function storefrontHeaders(config: ShopifyRuntimeConfig): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (config.storefrontPrivateToken) {
    headers["Shopify-Storefront-Private-Token"] =
      config.storefrontPrivateToken;
    return headers;
  }

  if (config.storefrontAccessToken) {
    headers["X-Shopify-Storefront-Access-Token"] =
      config.storefrontAccessToken;
  }

  return headers;
}

function shopifyStorefrontEndpoint(storeDomain: string): string {
  const normalizedDomain = storeDomain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `https://${normalizedDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

function getRuntimeEnv(): Record<string, string | undefined> {
  if (typeof process === "undefined") return {};

  return process.env;
}

async function hmacSha256Base64(
  rawBody: ArrayBuffer,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, rawBody);

  return bytesToBase64(new Uint8Array(signature));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}
