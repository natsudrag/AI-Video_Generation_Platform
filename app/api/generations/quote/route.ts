import {
  normalizeMode,
  normalizeQuality,
  quoteGeneration,
} from "@/app/lib/backend/catalog";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: string;
      modelId?: string;
      durationSeconds?: number | string;
      quality?: string;
      aspectRatio?: string;
    };
    const quote = quoteGeneration({
      mode: normalizeMode(body.mode ?? "image-to-video"),
      modelId: body.modelId ?? "veo-3",
      durationSeconds: parseDurationSeconds(body.durationSeconds),
      quality: normalizeQuality(body.quality ?? "pro"),
      aspectRatio: body.aspectRatio ?? "16:9",
    });

    return Response.json({ quote });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to quote job." },
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
