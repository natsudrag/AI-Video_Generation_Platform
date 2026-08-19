import { getCustomerSession, jsonWithSession } from "@/app/lib/backend/session";
import { ensureCustomer, getJob } from "@/app/lib/backend/store";

type JobRouteContext = {
  params: { jobId: string } | Promise<{ jobId: string }>;
};

export async function GET(request: Request, context: JobRouteContext) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  const { jobId } = await context.params;
  const job = await getJob(jobId);

  if (!job) {
    return jsonWithSession({ error: "Job not found." }, session, {
      status: 404,
    });
  }

  if (job.customerId !== session.customerId) {
    return jsonWithSession({ error: "Job is not available." }, session, {
      status: 403,
    });
  }

  return jsonWithSession({ job }, session);
}
