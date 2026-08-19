import {
  CREDIT_VALUE_CENTS,
  creditPackages,
  modelCatalog,
} from "@/app/lib/backend/catalog";
import { getProviderReadiness } from "@/app/lib/backend/providers";

export async function GET() {
  return Response.json({
    creditValueCents: CREDIT_VALUE_CENTS,
    creditPackages,
    models: modelCatalog.map((model) => {
      const readiness = getProviderReadiness(model.provider);

      return {
        ...model,
        providerReady: readiness.configured,
        missingProviderKeys: readiness.missing,
      };
    }),
  });
}
