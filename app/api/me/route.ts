import { getCustomerSession, jsonWithSession } from "@/app/lib/backend/session";
import {
  ensureCustomer,
  getCreditBalance,
  listCreditLedger,
  listJobs,
} from "@/app/lib/backend/store";

export async function GET(request: Request) {
  const session = getCustomerSession(request);
  await ensureCustomer(session.customerId);

  const [balance, ledger, jobs] = await Promise.all([
    getCreditBalance(session.customerId),
    listCreditLedger(session.customerId),
    listJobs(session.customerId),
  ]);

  return jsonWithSession(
    {
      customerId: session.customerId,
      balance,
      ledger: ledger.slice(0, 20),
      jobs: jobs.slice(0, 10),
    },
    session,
  );
}
