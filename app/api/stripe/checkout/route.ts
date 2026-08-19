import { creditPackages } from "@/app/lib/backend/catalog";
import { getCustomerSession, jsonWithSession } from "@/app/lib/backend/session";
import {
  createStripeCheckoutSession,
  getMissingStripeCheckoutKeys,
  getMissingStripeKeys,
  StripeSetupError,
} from "@/app/lib/backend/stripe";
import { ensureCustomer, upsertPayment } from "@/app/lib/backend/store";
import type { CreditPackageId } from "@/app/lib/backend/types";

export async function GET() {
  const checkoutMissing = getMissingStripeCheckoutKeys();
  const allMissing = getMissingStripeKeys();

  return Response.json({
    connected: checkoutMissing.length === 0,
    webhookConnected: !allMissing.includes("STRIPE_WEBHOOK_SECRET"),
    missing: allMissing,
    creditPackages,
  });
}

export async function POST(request: Request) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  try {
    const body = (await request.json()) as { packageId?: CreditPackageId };
    const packageId = body.packageId;
    const pack = creditPackages.find((item) => item.id === packageId);

    if (!packageId || !pack) {
      return jsonWithSession(
        { error: "Unknown credit package." },
        session,
        { status: 400 },
      );
    }

    const checkoutSession = await createStripeCheckoutSession({
      packageId,
      customerId: session.customerId,
      origin: requestOrigin(request),
    });

    await upsertPayment({
      id: `pay_${crypto.randomUUID()}`,
      provider: "stripe",
      providerSessionId: checkoutSession.id,
      providerPaymentIntentId: checkoutSession.payment_intent,
      customerId: session.customerId,
      packageId,
      credits: pack.credits,
      amountCents: pack.amountCents,
      status: "pending",
    });

    return jsonWithSession(
      {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
      session,
    );
  } catch (error) {
    if (error instanceof StripeSetupError) {
      return jsonWithSession(
        {
          setupRequired: true,
          error: "Stripe checkout is ready but needs environment variables.",
          missing: error.missing,
        },
        session,
        { status: 501 },
      );
    }

    return jsonWithSession(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Stripe checkout session.",
      },
      session,
      { status: 502 },
    );
  }
}

function requestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const url = new URL(request.url);
  const protocol = forwardedProto ?? url.protocol.replace(":", "") ?? "https";
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;

  return `${protocol}://${host}`;
}
