import type {
  CreditPackage,
  CreditPackageId,
  GenerationQuote,
  GenerationQuoteInput,
  ModelCatalogItem,
  QualityTier,
  StudioModeId,
} from "./types";

export const CREDIT_VALUE_CENTS = 12;

export const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 120,
    amountCents: 1900,
    description: "Explore the studio and run your first generation tests.",
  },
  {
    id: "creator",
    name: "Creator",
    credits: 420,
    amountCents: 4900,
    description: "Priority credits for creators producing every week.",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 1100,
    amountCents: 11900,
    description: "High-volume generation credits for client and team work.",
  },
];

export const modelCatalog: ModelCatalogItem[] = [
  {
    id: "veo-3",
    displayName: "Veo 3",
    provider: "vercel-ai-gateway",
    providerModel: "google/veo-3.1-generate-001",
    description: "Premium cinematic motion and photoreal scene generation.",
    supportedModes: ["text-to-video", "image-to-video"],
    supportedInputs: ["image"],
    supportedOutputs: ["video"],
    baseCredits: 46,
    estimatedProviderCostCents: 320,
    active: true,
  },
  {
    id: "kling-2-1",
    displayName: "Kling 2.1",
    provider: "kling",
    providerModel: "kling-v2-1",
    description: "Expressive motion, character movement, and product shots.",
    supportedModes: ["image-to-video", "text-to-video", "video-extend"],
    supportedInputs: ["image", "video"],
    supportedOutputs: ["video"],
    baseCredits: 30,
    estimatedProviderCostCents: 190,
    active: true,
  },
  {
    id: "runway-gen-4",
    displayName: "Runway Gen-4",
    provider: "runway",
    providerModel: "gen4_turbo",
    description: "Fast creative direction and controllable editorial video.",
    supportedModes: ["image-to-video", "text-to-video", "video-extend"],
    supportedInputs: ["image", "video"],
    supportedOutputs: ["video"],
    baseCredits: 35,
    estimatedProviderCostCents: 230,
    active: true,
  },
  {
    id: "sora-2",
    displayName: "Sora 2",
    provider: "openai",
    providerModel: "sora-2",
    description: "High-end cinematic world building and realistic continuity.",
    supportedModes: ["text-to-video", "image-to-video"],
    supportedInputs: ["image"],
    supportedOutputs: ["video"],
    baseCredits: 42,
    estimatedProviderCostCents: 290,
    active: true,
  },
  {
    id: "seedance",
    displayName: "Seedance",
    provider: "seedance",
    providerModel: "seedance-v1",
    description: "Lower-cost fast iteration for social and concept clips.",
    supportedModes: ["text-to-video", "image-to-video"],
    supportedInputs: ["image"],
    supportedOutputs: ["video"],
    baseCredits: 24,
    estimatedProviderCostCents: 120,
    active: true,
  },
];

const qualityMultipliers: Record<QualityTier, number> = {
  fast: 1,
  pro: 1.22,
  ultra: 1.55,
};

export function getCreditPackage(packageId: CreditPackageId) {
  return creditPackages.find((pack) => pack.id === packageId);
}

export function getModel(modelId: string) {
  return modelCatalog.find((model) => model.id === modelId && model.active);
}

export function quoteGeneration(input: GenerationQuoteInput): GenerationQuote {
  const model = getModel(input.modelId);

  if (!model) {
    throw new Error("Unknown or inactive model.");
  }

  if (!model.supportedModes.includes(input.mode)) {
    throw new Error(`${model.displayName} does not support ${input.mode}.`);
  }

  const durationCredits = Math.max(0, input.durationSeconds - 5) * 2.4;
  const modePremium = modeCreditPremium(input.mode);
  const rawCredits =
    (model.baseCredits + durationCredits + modePremium) *
    qualityMultipliers[input.quality];
  const creditCost = Math.ceil(rawCredits);
  const customerValueCents = creditCost * CREDIT_VALUE_CENTS;
  const estimatedProviderCostCents = Math.ceil(
    model.estimatedProviderCostCents *
      (input.durationSeconds / 5) *
      qualityMultipliers[input.quality],
  );
  const estimatedPaymentFeeCents = estimatePaymentFee(customerValueCents);

  return {
    ...input,
    model,
    creditCost,
    customerValueCents,
    estimatedProviderCostCents,
    estimatedPaymentFeeCents,
    estimatedGrossMarginCents:
      customerValueCents - estimatedProviderCostCents - estimatedPaymentFeeCents,
  };
}

export function normalizeMode(mode: string): StudioModeId {
  const lower = mode.trim().toLowerCase();
  if (lower === "image to video" || lower === "image-to-video") {
    return "image-to-video";
  }
  if (lower === "text to video" || lower === "text-to-video") {
    return "text-to-video";
  }
  if (lower === "video extend" || lower === "video-extend") {
    return "video-extend";
  }

  throw new Error("Unsupported generation mode.");
}

export function normalizeQuality(quality: string): QualityTier {
  const lower = quality.trim().toLowerCase();
  if (lower === "fast" || lower === "pro" || lower === "ultra") {
    return lower;
  }

  throw new Error("Unsupported quality tier.");
}

function modeCreditPremium(mode: StudioModeId): number {
  if (mode === "video-extend") return 10;
  if (mode === "image-to-video") return 5;
  return 0;
}

function estimatePaymentFee(amountCents: number): number {
  return Math.ceil(amountCents * 0.029 + 30);
}
