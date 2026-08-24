import { createSeedState } from "../data/seed";
import type { MarinaState, SpaceKind } from "../types/domain";
import { withReservationDefaults } from "./reservation-footer";

export type PersistedDemoState = MarinaState & { kindFilter: SpaceKind[] };

export const DEMO_STORAGE_KEY = "harbr-yard-demo:v3";

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
    launchTasks: (parsed.launchTasks ?? seed.launchTasks).map((task) => ({
      ...task,
      source: task.source ?? ("staff" as const),
    })),
    reservations: (parsed.reservations ?? seed.reservations).map((reservation) => {
      const withDefaults = withReservationDefaults(reservation);
      if (!withDefaults.job) return withDefaults;
      const defaultPhotos = [
        { stage: "lift_out" as const, done: false },
        { stage: "relaunch" as const, done: false },
      ];
      return {
        ...withDefaults,
        job: {
          ...withDefaults.job,
          workBy: withDefaults.job.workBy ?? "marina",
          photos: withDefaults.job.photos?.length ? withDefaults.job.photos : defaultPhotos,
        },
      };
    }),
  };
}

export function loadDemoState(): PersistedDemoState {
  const fallback = createInitialStoreState();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
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
