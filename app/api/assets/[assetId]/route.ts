import { readAssetBytes } from "@/app/lib/backend/storage";

type AssetRouteContext = {
  params: { assetId: string } | Promise<{ assetId: string }>;
};

export async function GET(_request: Request, context: AssetRouteContext) {
  try {
    const { assetId } = await context.params;
    const { asset, bytes } = await readAssetBytes(assetId);

    return new Response(bytes, {
      headers: {
        "content-type": asset.contentType,
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Asset not found." }, { status: 404 });
  }
}
