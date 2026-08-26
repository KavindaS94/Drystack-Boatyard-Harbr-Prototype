import { DEFAULT_QA_PHOTOS, migrateJobPhoto } from "./checklist";
import { createSeedState } from "../data/seed";
import type { JobType, MarinaState, SpaceKind } from "../types/domain";
import { withReservationDefaults } from "./reservation-footer";

export type PersistedDemoState = MarinaState & { kindFilter: SpaceKind[] };

export const DEMO_STORAGE_KEY = "harbr-yard-demo:v8";
const PREV_STORAGE_KEY = "harbr-yard-demo:v7";

const DEFAULT_KIND_FILTER: SpaceKind[] = ["wet", "boatyard", "dry_storage"];

export function createInitialStoreState(): PersistedDemoState {
  return {
    ...createSeedState(),
    kindFilter: [...DEFAULT_KIND_FILTER],
  };
}

function isStoreState(value: unknown): value is PersistedDemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as PersistedDemoState;
  return (
    Array.isArray(candidate.reservations) &&
    Array.isArray(candidate.vessels) &&
    Array.isArray(candidate.berths) &&
    Array.isArray(candidate.launchTasks) &&
    Array.isArray(candidate.invoices) &&
    candidate.settings != null &&
    typeof candidate.role === "string"
  );
}

function migrateJobType(jobType: JobType, seedTypes: JobType[]): JobType {
  const seeded = seedTypes.find((item) => item.id === jobType.id);
  const photoChecklist = Array.isArray(jobType.photoChecklist)
    ? jobType.photoChecklist
    : (seeded?.photoChecklist ?? [...DEFAULT_QA_PHOTOS]);
  return {
    ...jobType,
    checklist: Array.isArray(jobType.checklist) ? jobType.checklist : (seeded?.checklist ?? []),
    photoChecklist,
  };
}

function migrateLoadedState(parsed: PersistedDemoState): PersistedDemoState {
  const seed = createInitialStoreState();
  return {
    ...seed,
    ...parsed,
    settings: {
      ...seed.settings,
      ...parsed.settings,
    },
    kindFilter:
      Array.isArray(parsed.kindFilter) && parsed.kindFilter.length > 0
        ? parsed.kindFilter
        : [...DEFAULT_KIND_FILTER],
    portalLinks: Array.isArray(parsed.portalLinks) ? parsed.portalLinks : seed.portalLinks,
    changeRequests: Array.isArray(parsed.changeRequests) ? parsed.changeRequests : seed.changeRequests,
    activity: Array.isArray(parsed.activity) ? parsed.activity : seed.activity,
    messages: Array.isArray(parsed.messages) ? parsed.messages : seed.messages,
    customers: (parsed.customers ?? seed.customers).map((customer) => {
      const seeded = seed.customers.find((item) => item.id === customer.id);
      return {
        ...customer,
        email: customer.email ?? seeded?.email ?? `${customer.id}@harbour.demo`,
        phone: customer.phone ?? seeded?.phone ?? "+61 400 000 000",
        accountOverdue: customer.accountOverdue ?? false,
      };
    }),
    vessels: (parsed.vessels ?? seed.vessels).map((vessel) => {
      const seeded = seed.vessels.find((item) => item.id === vessel.id);
      return {
        ...vessel,
        insuranceExpiry: vessel.insuranceExpiry ?? seeded?.insuranceExpiry ?? "2027-01-01",
      };
    }),
    products: (() => {
      const existing = parsed.products ?? seed.products;
      const byId = new Map(existing.map((product) => [product.id, product]));
      for (const product of seed.products) {
        if (!byId.has(product.id)) byId.set(product.id, product);
      }
      return [...byId.values()];
    })(),
    jobTypes: (parsed.jobTypes ?? seed.jobTypes).map((jobType) => migrateJobType(jobType, seed.jobTypes)),
    taskTypes: (parsed.taskTypes ?? seed.taskTypes).map((taskType) => {
      const seeded = seed.taskTypes.find((item) => item.id === taskType.id);
      return {
        ...taskType,
        checklist: Array.isArray(taskType.checklist) ? taskType.checklist : (seeded?.checklist ?? []),
        productId: taskType.productId ?? seeded?.productId,
      };
    }),
    launchTasks: (parsed.launchTasks ?? seed.launchTasks).map((task) => ({
      ...task,
      source: task.source ?? ("staff" as const),
      invoiceId: task.invoiceId,
    })),
    reservations: (parsed.reservations ?? seed.reservations).map((reservation) => {
      const withDefaults = withReservationDefaults(reservation);
      if (!withDefaults.job) return withDefaults;
      return {
        ...withDefaults,
        job: {
          ...withDefaults.job,
          workBy: withDefaults.job.workBy ?? "marina",
          checklist: Array.isArray(withDefaults.job.checklist) ? withDefaults.job.checklist : [],
          photos: (withDefaults.job.photos ?? []).map(migrateJobPhoto),
        },
      };
    }),
  };
}

export function loadDemoState(): PersistedDemoState {
  const fallback = createInitialStoreState();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY) ?? window.localStorage.getItem(PREV_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoreState(parsed)) return fallback;
    return migrateLoadedState(parsed);
  } catch {
    return fallback;
  }
}

export function saveDemoState(state: PersistedDemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode — demo still works in memory.
  }
}

export function clearDemoState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
