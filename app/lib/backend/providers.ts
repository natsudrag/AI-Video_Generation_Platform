import type {
  AssetRecord,
  GenerationJob,
  JobStatus,
  ModelCatalogItem,
  ProviderId,
} from "./types";

type ProviderReadiness = {
  provider: ProviderId;
  configured: boolean;
  missing: string[];
};

type DispatchResult = {
  status: JobStatus;
  providerJobId?: string;
  resultUrl?: string;
  message?: string;
};

const providerEnvKeys: Record<ProviderId, string[]> = {
  "vercel-ai-gateway": ["AI_GATEWAY_API_KEY"],
  runway: ["RUNWAY_API_KEY"],
  kling: ["KLING_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  replicate: ["REPLICATE_API_TOKEN"],
  seedance: ["SEEDANCE_API_KEY"],
};

export class ProviderSetupError extends Error {
  missing: string[];
  provider: ProviderId;

  constructor(provider: ProviderId, missing: string[]) {
    super(`${provider} is not configured.`);
    this.name = "ProviderSetupError";
    this.provider = provider;
    this.missing = missing;
  }
}

export function getProviderReadiness(provider: ProviderId): ProviderReadiness {
  const runtimeEnv = getRuntimeEnv();
  const required = providerEnvKeys[provider];
  const missing = required.filter((key) => !runtimeEnv[key]);

  return {
    provider,
    configured: missing.length === 0,
    missing,
  };
}

export function isMockGenerationEnabled(): boolean {
  return getRuntimeEnv().MOTIONFORGE_MOCK_GENERATION === "true";
}

export async function dispatchGeneration({
  job,
  model,
  inputAsset,
}: {
  job: GenerationJob;
  model: ModelCatalogItem;
  inputAsset?: AssetRecord;
}): Promise<DispatchResult> {
  const readiness = getProviderReadiness(model.provider);

  if (!readiness.configured && !isMockGenerationEnabled()) {
    throw new ProviderSetupError(model.provider, readiness.missing);
  }

  if (isMockGenerationEnabled()) {
    return {
      status: "completed",
      providerJobId: `mock_${crypto.randomUUID()}`,
      resultUrl: "/og.png",
      message: "Mock generation completed.",
    };
  }

  return {
    status: "awaiting_provider",
    providerJobId: `${model.provider}_${crypto.randomUUID()}`,
    message: buildProviderDispatchMessage(job, model, inputAsset),
  };
}

function buildProviderDispatchMessage(
  job: GenerationJob,
  model: ModelCatalogItem,
  inputAsset?: AssetRecord,
): string {
  const inputSummary = inputAsset
    ? `${inputAsset.kind} asset ${inputAsset.id}`
    : "text prompt";

  return [
    `Queued ${job.mode} job for ${model.displayName}.`,
    `Input: ${inputSummary}.`,
    "Provider key is configured; provider-specific submit/status polling can be enabled when final vendor API keys and model endpoint choices are confirmed.",
  ].join(" ");
}

function getRuntimeEnv(): Record<string, string | undefined> {
  if (typeof process === "undefined") {
    return {};
  }

  return process.env;
}
