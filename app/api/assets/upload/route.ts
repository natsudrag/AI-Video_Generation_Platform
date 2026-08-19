import { getCustomerSession, jsonWithSession } from "@/app/lib/backend/session";
import { saveUploadedAsset } from "@/app/lib/backend/storage";
import { ensureCustomer } from "@/app/lib/backend/store";

export async function POST(request: Request) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonWithSession(
        { error: "Upload requires a file field." },
        session,
        { status: 400 },
      );
    }

    const asset = await saveUploadedAsset({
      customerId: session.customerId,
      file,
    });

    return jsonWithSession({ asset }, session);
  } catch (error) {
    return jsonWithSession(
      {
        error:
          error instanceof Error ? error.message : "Unable to store uploaded file.",
      },
      session,
      { status: 400 },
    );
  }
}
