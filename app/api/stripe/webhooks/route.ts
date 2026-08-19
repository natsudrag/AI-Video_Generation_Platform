import {
  getPackageFromStripeMetadata,
  getStripeConfig,
  verifyStripeWebhook,
  type StripeEvent,
} from "@/app/lib/backend/stripe";
import {
  addCreditEntry,
  getPaymentByProviderSession,
  markWebhookProcessed,
  upsertPayment,
} from "@/app/lib/backend/store";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const config = getStripeConfig();

  if (!config.webhookSecret) {
    return Response.json(
      {
        setupRequired: true,
        error: "STRIPE_WEBHOOK_SECRET is required before accepting webhooks.",
      },
      { status: 501 },
    );
  }

  const verified = await verifyStripeWebhook(
    rawBody,
    request.headers.get("stripe-signature"),
    config.webhookSecret,
  );

  if (!verified) {
    return Response.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 401 },
    );
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  if (!event.id) {
    return Response.json({ error: "Missing webhook id." }, { status: 400 });
  }

  const shouldProcess = await markWebhookProcessed(event.id);
  if (!shouldProcess) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event);
  }

  return Response.json({ ok: true });
}

async function handleCheckoutCompleted(event: StripeEvent): Promise<void> {
  const session = event.data?.object;
  const metadata = session?.metadata;
  const pack = getPackageFromStripeMetadata(metadata);
  const customerId = metadata?.customer_id ?? session?.client_reference_id;

  if (!session?.id || !pack || !customerId) {
    return;
  }

  const existing = await getPaymentByProviderSession(session.id);
  const paymentId = existing?.id ?? `pay_${crypto.randomUUID()}`;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : existing?.providerPaymentIntentId;

  await upsertPayment({
    id: paymentId,
    provider: "stripe",
    providerSessionId: session.id,
    providerPaymentIntentId: paymentIntent,
    customerId,
    packageId: pack.id,
    credits: pack.credits,
    amountCents: session.amount_total ?? pack.amountCents,
    status: "paid",
    createdAt: existing?.createdAt,
  });

  await addCreditEntry({
    customerId,
    amount: pack.credits,
    reason: "stripe_purchase",
    relatedId: paymentId,
    description: `${pack.name} credit pack paid through Stripe`,
  });
}
