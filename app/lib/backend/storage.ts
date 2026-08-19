import { createAsset, getAsset } from "./store";
import type { AssetKind, AssetRecord } from "./types";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export async function saveUploadedAsset({
  customerId,
  file,
}: {
  customerId: string;
  file: File;
}): Promise<AssetRecord> {
  const kind = assetKindFromContentType(file.type);
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (file.size > maxBytes) {
    throw new Error(
      `${kind === "image" ? "Image" : "Video"} uploads must be ${Math.floor(
        maxBytes / 1024 / 1024,
      )}MB or smaller.`,
    );
  }

  const id = `ast_${crypto.randomUUID()}`;
  const extension = extensionFromFile(file);
  const storageKey = `${customerId}/${id}${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await writeLocalAsset(storageKey, bytes);

  return createAsset({
    id,
    customerId,
    kind,
    fileName: file.name || `${id}${extension}`,
    contentType: file.type || defaultContentType(kind),
    byteSize: file.size,
    storageProvider: "local",
    storageKey,
    publicUrl: `/api/assets/${id}`,
  });
}

export async function readAssetBytes(assetId: string): Promise<{
  asset: AssetRecord;
  bytes: Uint8Array;
}> {
  const asset = await getAsset(assetId);

  if (!asset) {
    throw new Error("Asset not found.");
  }

  if (asset.storageProvider !== "local") {
    throw new Error("External asset storage is not readable locally.");
  }

  return {
    asset,
    bytes: await readLocalAsset(asset.storageKey),
  };
}

function assetKindFromContentType(contentType: string): AssetKind {
  if (contentType.startsWith("image/")) {
    return "image";
  }

  if (contentType.startsWith("video/")) {
    return "video";
  }

  throw new Error("Upload must be an image or video file.");
}

function extensionFromFile(file: File): string {
  const nameExtension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();

  if (nameExtension) {
    return nameExtension;
  }

  const byType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };

  return byType[file.type] ?? ".bin";
}

async function writeLocalAsset(
  storageKey: string,
  bytes: Uint8Array,
): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const absolutePath = getLocalAssetPath(path, storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, bytes);
  } catch (error) {
    throw new Error(
      `Local upload storage is not available: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

async function readLocalAsset(storageKey: string): Promise<Uint8Array> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  return fs.readFile(getLocalAssetPath(path, storageKey));
}

function getLocalAssetPath(
  path: typeof import("node:path"),
  storageKey: string,
): string {
  const dataRoot =
    getRuntimeEnv().MOTIONFORGE_DATA_DIR ??
    getRuntimeEnv().RAILWAY_VOLUME_MOUNT_PATH ??
    path.join(getCurrentWorkingDirectory(), ".data");

  return path.join(dataRoot, "uploads", storageKey);
}

function defaultContentType(kind: AssetKind): string {
  return kind === "image" ? "image/png" : "video/mp4";
}

function getCurrentWorkingDirectory(): string {
  if (typeof process === "undefined") {
    return ".";
  }

  return process.cwd();
}

function getRuntimeEnv(): Record<string, string | undefined> {
  if (typeof process === "undefined") {
    return {};
  }

  return process.env;
}
