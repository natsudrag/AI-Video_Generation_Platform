import {
  getModel,
  normalizeMode,
  normalizeQuality,
  quoteGeneration,
} from "@/app/lib/backend/catalog";
import {
  dispatchGeneration,
  getProviderReadiness,
  ProviderSetupError,
} from "@/app/lib/backend/providers";
import { getCustomerSession, jsonWithSession } from "@/app/lib/backend/session";
import {
  addCreditEntry,
  createJob,
  ensureCustomer,
  getAsset,
  getCreditBalance,
  listJobs,
  updateJob,
} from "@/app/lib/backend/store";

export async function GET(request: Request) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  return jsonWithSession(
    {
      jobs: (await listJobs(session.customerId)).slice(0, 25),
      balance: await getCreditBalance(session.customerId),
    },
    session,
  );
}

export async function POST(request: Request) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  try {
    const body = (await request.json()) as {
      prompt?: string;
      mode?: string;
      modelId?: string;
      durationSeconds?: number | string;
      quality?: string;
      aspectRatio?: string;
      inputAssetId?: string;
    };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return jsonWithSession(
        { error: "Prompt is required." },
        session,
        { status: 400 },
      );
    }

    const mode = normalizeMode(body.mode ?? "image-to-video");
    const modelId = body.modelId ?? "veo-3";
    const model = getModel(modelId);

    if (!model) {
      return jsonWithSession(
        { error: "Unknown model." },
        session,
        { status: 400 },
      );
    }

    const quote = quoteGeneration({
      mode,
      modelId,
      durationSeconds: parseDurationSeconds(body.durationSeconds),
      quality: normalizeQuality(body.quality ?? "pro"),
      aspectRatio: body.aspectRatio ?? "16:9",
    });

    const inputAsset = body.inputAssetId
      ? await getAsset(body.inputAssetId)
      : undefined;

    if (body.inputAssetId && !inputAsset) {
      return jsonWithSession(
        { error: "Input asset was not found." },
        session,
        { status: 404 },
      );
    }

    if (inputAsset && inputAsset.customerId !== session.customerId) {
      return jsonWithSession(
        { error: "Input asset is not available to this customer." },
        session,
        { status: 403 },
      );
    }

    if (mode === "image-to-video" && inputAsset?.kind !== "image") {
      return jsonWithSession(
        { error: "Image-to-video generation requires an uploaded image." },
        session,
        { status: 400 },
      );
    }

    if (mode === "video-extend" && inputAsset?.kind !== "video") {
      return jsonWithSession(
        { error: "Video extension requires an uploaded video." },
        session,
        { status: 400 },
      );
    }

    const readiness = getProviderReadiness(model.provider);
    if (!readiness.configured) {
      return jsonWithSession(
        {
          providerSetupRequired: true,
          provider: model.provider,
          missing: readiness.missing,
          error: `${model.displayName} needs provider credentials before live generation.`,
        },
        session,
        { status: 501 },
      );
    }

    const balance = await getCreditBalance(session.customerId);
    if (balance < quote.creditCost) {
      return jsonWithSession(
        {
          paymentRequired: true,
          balance,
          creditCost: quote.creditCost,
          error: "Not enough credits for this generation.",
        },
        session,
        { status: 402 },
      );
    }

    const job = await createJob({
      customerId: session.customerId,
      mode,
      modelId,
      provider: model.provider,
      providerModel: model.providerModel,
      prompt,
      aspectRatio: quote.aspectRatio,
      durationSeconds: quote.durationSeconds,
      quality: quote.quality,
      inputAssetId: inputAsset?.id,
      creditCost: quote.creditCost,
      estimatedProviderCostCents: quote.estimatedProviderCostCents,
      status: "queued",
    });

    await addCreditEntry({
      customerId: session.customerId,
      amount: -quote.creditCost,
      reason: "generation_reserve",
      relatedId: job.id,
      description: `${model.displayName} generation reserved ${quote.creditCost} credits`,
    });

    try {
      const dispatch = await dispatchGeneration({ job, model, inputAsset });
      const updatedJob =
        (await updateJob(job.id, {
          status: dispatch.status,
          providerJobId: dispatch.providerJobId,
          resultUrl: dispatch.resultUrl,
          error: dispatch.message,
        })) ?? job;

      return jsonWithSession(
        {
          job: updatedJob,
          balance: await getCreditBalance(session.customerId),
          quote,
        },
        session,
      );
    } catch (error) {
      await addCreditEntry({
        customerId: session.customerId,
        amount: quote.creditCost,
        reason: "generation_refund",
        relatedId: job.id,
        description: `${model.displayName} generation refunded after dispatch failure`,
      });

      await updateJob(job.id, {
        status: error instanceof ProviderSetupError ? "refunded" : "failed",
        error:
          error instanceof Error
            ? error.message
            : "Generation dispatch failed.",
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof ProviderSetupError) {
      return jsonWithSession(
        {
          providerSetupRequired: true,
          provider: error.provider,
          missing: error.missing,
          error: error.message,
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
            : "Unable to create generation job.",
      },
      session,
      { status: 400 },
    );
  }
}

function parseDurationSeconds(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(30, Math.floor(value)));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(30, parsed));
    }
  }

  return 5;
}
