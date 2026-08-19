import { creditPackages, getCreditPackage } from "./catalog";
import type { CreditPackage, CreditPackageId } from "./types";

export type StripeRuntimeConfig = {
  secretKey?: string;
  webhookSecret?: string;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_intent?: string;
};

export type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: StripeCheckoutSession & {
      client_reference_id?: string;
      metadata?: Record<string, string>;
      payment_status?: string;
      amount_total?: number;
    };
  };
};

export class StripeSetupError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super("Stripe is not fully configured.");
    this.name = "StripeSetupError";
    this.missing = missing;
  }
}

export function getStripeConfig(): StripeRuntimeConfig {
  const runtimeEnv = getRuntimeEnv();

  return {
    secretKey: runtimeEnv.STRIPE_SECRET_KEY,
    webhookSecret: runtimeEnv.STRIPE_WEBHOOK_SECRET,
  };
}

export function getMissingStripeKeys(config = getStripeConfig()): string[] {
  const missing: string[] = [];

  if (!config.secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!config.webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");

  return missing;
}

export function getMissingStripeCheckoutKeys(
  config = getStripeConfig(),
): string[] {
  return config.secretKey ? [] : ["STRIPE_SECRET_KEY"];
}

export async function createStripeCheckoutSession({
  packageId,
  customerId,
  origin,
}: {
  packageId: CreditPackageId;
  customerId: string;
  origin: string;
}): Promise<StripeCheckoutSession> {
  const config = getStripeConfig();
  const missing = getMissingStripeCheckoutKeys(config);
  const pack = getCreditPackage(packageId);

  if (!pack) {
    throw new Error("Unknown credit package.");
  }

  if (missing.length || !config.secretKey) {
    throw new StripeSetupError(missing);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: buildCheckoutParams(pack, customerId, origin),
  });
  const payload = (await response.json()) as
    | StripeCheckoutSession
    | { error?: { message?: string } };

  if (!response.ok) {
    const message =
      "error" in payload && payload.error?.message
        ? payload.error.message
        : `Stripe returned ${response.status}.`;
    throw new Error(message);
  }

  return payload as StripeCheckoutSession;
}

export function getPackageFromStripeMetadata(
  metadata: Record<string, string> | undefined,
): CreditPackage | undefined {
  const packageId = metadata?.package_id as CreditPackageId | undefined;

  if (!packageId) {
    return undefined;
  }

  return getCreditPackage(packageId);
}

export async function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret = getStripeConfig().webhookSecret,
): Promise<boolean> {
  if (!secret || !signatureHeader) {
    return false;
  }

  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(parsed.timestamp));
  if (ageSeconds > 300) {
    return false;
  }

  const expected = await hmacSha256Hex(`${parsed.timestamp}.${rawBody}`, secret);

  return parsed.signatures.some((signature) =>
    timingSafeEqualHex(expected, signature),
  );
}

function buildCheckoutParams(
  pack: CreditPackage,
  customerId: string,
  origin: string,
): URLSearchParams {
  const successUrl = new URL("/", origin);
  successUrl.searchParams.set("payment", "success");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/", origin);
  cancelUrl.searchParams.set("payment", "cancelled");

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", customerId);
  params.set("success_url", successUrl.toString());
  params.set("cancel_url", cancelUrl.toString());
  params.set("allow_promotion_codes", "true");
  params.set("payment_method_types[0]", "card");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", `${pack.amountCents}`);
  params.set("line_items[0][price_data][product_data][name]", `${pack.name} credits`);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${pack.credits} MotionForge credits. ${pack.description}`,
  );
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[customer_id]", customerId);
  params.set("metadata[package_id]", pack.id);
  params.set("metadata[credits]", `${pack.credits}`);
  params.set("metadata[source]", "motionforge-ai");
  params.set("payment_intent_data[metadata][customer_id]", customerId);
  params.set("payment_intent_data[metadata][package_id]", pack.id);

  return params;
}

function parseStripeSignature(signatureHeader: string): {
  timestamp?: string;
  signatures: string[];
} {
  const pairs = signatureHeader.split(",").map((part) => part.trim().split("="));

  return {
    timestamp: pairs.find(([key]) => key === "t")?.[1],
    signatures: pairs
      .filter(([key, value]) => key === "v1" && Boolean(value))
      .map(([, value]) => value),
  };
}

async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return bytesToHex(new Uint8Array(signature));
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}

function getRuntimeEnv(): Record<string, string | undefined> {
  if (typeof process === "undefined") {
    return {};
  }

  return process.env;
}

export { creditPackages };
