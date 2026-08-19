import type {
  AssetRecord,
  CreditLedgerEntry,
  CustomerAccount,
  GenerationJob,
  PaymentRecord,
  StoreData,
} from "./types";

const STORE_FILE_NAME = "motionforge-store.json";
const DEFAULT_STARTING_CREDITS = 24;

let cachedData: StoreData | undefined;

export async function ensureCustomer(
  customerId: string,
): Promise<CustomerAccount> {
  const data = await loadData();
  const existing = data.customers.find((customer) => customer.id === customerId);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const customer: CustomerAccount = {
    id: customerId,
    createdAt: now,
    updatedAt: now,
  };

  data.customers.push(customer);

  const startingCredits = getStartingCredits();
  if (startingCredits > 0) {
    data.creditLedger.push({
      id: `led_${crypto.randomUUID()}`,
      customerId,
      amount: startingCredits,
      reason: "trial_grant",
      description: `${startingCredits} launch credits`,
      createdAt: now,
    });
  }

  await saveData(data);
  return customer;
}

export async function getCreditBalance(customerId: string): Promise<number> {
  const data = await loadData();

  return data.creditLedger
    .filter((entry) => entry.customerId === customerId)
    .reduce((balance, entry) => balance + entry.amount, 0);
}

export async function listCreditLedger(
  customerId: string,
): Promise<CreditLedgerEntry[]> {
  const data = await loadData();

  return data.creditLedger
    .filter((entry) => entry.customerId === customerId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function addCreditEntry(
  entry: Omit<CreditLedgerEntry, "id" | "createdAt">,
): Promise<CreditLedgerEntry> {
  const data = await loadData();
  const created: CreditLedgerEntry = {
    ...entry,
    id: `led_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };

  data.creditLedger.push(created);
  await saveData(data);

  return created;
}

export async function upsertPayment(
  payment: Omit<PaymentRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<PaymentRecord> {
  const data = await loadData();
  const now = new Date().toISOString();
  const index = data.payments.findIndex((item) => item.id === payment.id);
  const record: PaymentRecord = {
    ...payment,
    createdAt:
      payment.createdAt ?? (index >= 0 ? data.payments[index].createdAt : now),
    updatedAt: payment.updatedAt ?? now,
  };

  if (index >= 0) {
    data.payments[index] = record;
  } else {
    data.payments.push(record);
  }

  await saveData(data);
  return record;
}

export async function getPayment(paymentId: string) {
  const data = await loadData();

  return data.payments.find((payment) => payment.id === paymentId);
}

export async function getPaymentByProviderSession(providerSessionId: string) {
  const data = await loadData();

  return data.payments.find(
    (payment) => payment.providerSessionId === providerSessionId,
  );
}

export async function markWebhookProcessed(webhookId: string): Promise<boolean> {
  const data = await loadData();

  if (data.processedWebhookIds.includes(webhookId)) {
    return false;
  }

  data.processedWebhookIds.push(webhookId);
  await saveData(data);

  return true;
}

export async function createAsset(
  asset: Omit<AssetRecord, "createdAt">,
): Promise<AssetRecord> {
  const data = await loadData();
  const record: AssetRecord = {
    ...asset,
    createdAt: new Date().toISOString(),
  };

  data.assets.push(record);
  await saveData(data);

  return record;
}

export async function getAsset(assetId: string) {
  const data = await loadData();

  return data.assets.find((asset) => asset.id === assetId);
}

export async function createJob(
  job: Omit<GenerationJob, "id" | "createdAt" | "updatedAt">,
): Promise<GenerationJob> {
  const data = await loadData();
  const now = new Date().toISOString();
  const record: GenerationJob = {
    ...job,
    id: `job_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };

  data.jobs.push(record);
  await saveData(data);

  return record;
}

export async function updateJob(
  jobId: string,
  patch: Partial<Omit<GenerationJob, "id" | "createdAt">>,
): Promise<GenerationJob | undefined> {
  const data = await loadData();
  const index = data.jobs.findIndex((job) => job.id === jobId);

  if (index === -1) {
    return undefined;
  }

  const updated: GenerationJob = {
    ...data.jobs[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  data.jobs[index] = updated;
  await saveData(data);

  return updated;
}

export async function getJob(jobId: string) {
  const data = await loadData();

  return data.jobs.find((job) => job.id === jobId);
}

export async function listJobs(customerId: string): Promise<GenerationJob[]> {
  const data = await loadData();

  return data.jobs
    .filter((job) => job.customerId === customerId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function loadData(): Promise<StoreData> {
  if (cachedData) {
    return cachedData;
  }

  cachedData = (await readStoreFile()) ?? emptyStore();
  return cachedData;
}

async function saveData(data: StoreData): Promise<void> {
  cachedData = data;

  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const storePath = getStoreFilePath(path);
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // File persistence is best-effort so local previews and edge-like test
    // environments can still use the backend in memory.
  }
}

async function readStoreFile(): Promise<StoreData | undefined> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const raw = await fs.readFile(getStoreFilePath(path), "utf8");

    return normalizeStore(JSON.parse(raw) as Partial<StoreData>);
  } catch {
    return undefined;
  }
}

function emptyStore(): StoreData {
  return {
    customers: [],
    creditLedger: [],
    payments: [],
    assets: [],
    jobs: [],
    processedWebhookIds: [],
  };
}

function normalizeStore(partial: Partial<StoreData>): StoreData {
  return {
    customers: partial.customers ?? [],
    creditLedger: partial.creditLedger ?? [],
    payments: partial.payments ?? [],
    assets: partial.assets ?? [],
    jobs: partial.jobs ?? [],
    processedWebhookIds: partial.processedWebhookIds ?? [],
  };
}

function getStartingCredits(): number {
  const raw = getRuntimeEnv().MOTIONFORGE_STARTING_CREDITS;
  const parsed = raw ? Number(raw) : DEFAULT_STARTING_CREDITS;

  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getStoreFilePath(path: typeof import("node:path")): string {
  const runtimeEnv = getRuntimeEnv();
  const dataRoot =
    runtimeEnv.MOTIONFORGE_DATA_DIR ??
    runtimeEnv.RAILWAY_VOLUME_MOUNT_PATH ??
    path.join(getCurrentWorkingDirectory(), ".data");

  return path.join(dataRoot, STORE_FILE_NAME);
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
