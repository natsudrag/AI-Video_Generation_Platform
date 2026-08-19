export type StudioModeId = "image-to-video" | "text-to-video" | "video-extend";

export type QualityTier = "fast" | "pro" | "ultra";

export type AssetKind = "image" | "video";

export type ProviderId =
  | "vercel-ai-gateway"
  | "runway"
  | "kling"
  | "openai"
  | "replicate"
  | "seedance";

export type JobStatus =
  | "queued"
  | "processing"
  | "awaiting_provider"
  | "completed"
  | "failed"
  | "refunded";

export type CreditPackageId = "starter" | "creator" | "studio";

export type CreditPackage = {
  id: CreditPackageId;
  name: string;
  credits: number;
  amountCents: number;
  description: string;
};

export type ModelCatalogItem = {
  id: string;
  displayName: string;
  provider: ProviderId;
  providerModel: string;
  description: string;
  supportedModes: StudioModeId[];
  supportedInputs: AssetKind[];
  supportedOutputs: AssetKind[];
  baseCredits: number;
  estimatedProviderCostCents: number;
  active: boolean;
};

export type GenerationQuoteInput = {
  mode: StudioModeId;
  modelId: string;
  durationSeconds: number;
  quality: QualityTier;
  aspectRatio: string;
};

export type GenerationQuote = GenerationQuoteInput & {
  model: ModelCatalogItem;
  creditCost: number;
  customerValueCents: number;
  estimatedProviderCostCents: number;
  estimatedPaymentFeeCents: number;
  estimatedGrossMarginCents: number;
};

export type CustomerAccount = {
  id: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
  name?: string;
};

export type CreditLedgerEntry = {
  id: string;
  customerId: string;
  amount: number;
  reason:
    | "trial_grant"
    | "stripe_purchase"
    | "generation_reserve"
    | "generation_refund"
    | "manual_adjustment";
  relatedId?: string;
  description: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  provider: "stripe";
  providerSessionId?: string;
  providerPaymentIntentId?: string;
  customerId: string;
  packageId: CreditPackageId;
  credits: number;
  amountCents: number;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  customerId: string;
  kind: AssetKind;
  fileName: string;
  contentType: string;
  byteSize: number;
  storageProvider: "local" | "external";
  storageKey: string;
  publicUrl?: string;
  createdAt: string;
};

export type GenerationJob = {
  id: string;
  customerId: string;
  mode: StudioModeId;
  modelId: string;
  provider: ProviderId;
  providerModel: string;
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  quality: QualityTier;
  inputAssetId?: string;
  outputAssetId?: string;
  creditCost: number;
  estimatedProviderCostCents: number;
  status: JobStatus;
  providerJobId?: string;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type StoreData = {
  customers: CustomerAccount[];
  creditLedger: CreditLedgerEntry[];
  payments: PaymentRecord[];
  assets: AssetRecord[];
  jobs: GenerationJob[];
  processedWebhookIds: string[];
};
