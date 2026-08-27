import { DEFAULT_CHECKLIST_CATEGORIES, DEFAULT_QA_PHOTOS, migrateChecklistItem, migrateChecklistOptions, migrateJobPhoto } from "./checklist";
import { createSeedState } from "../data/seed";
import { DEMO_TODAY, DEMO_WEEK_END, DEMO_WEEK_START } from "./demo-dates";
import type { JobType, MarinaState, SpaceKind } from "../types/domain";
import { withReservationDefaults } from "./reservation-footer";

export type PersistedDemoState = MarinaState & { kindFilter: SpaceKind[] };

export const DEMO_STORAGE_KEY = "harbr-yard-demo:v9";
const PREV_STORAGE_KEY = "harbr-yard-demo:v8";

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
  const checklist = migrateChecklistOptions(jobType.checklist, "Yard job");
  const photoChecklist = migrateChecklistOptions(jobType.photoChecklist, "QA photo");
  return {
    ...jobType,
    checklist: checklist.length ? checklist : (seeded?.checklist ?? []),
    photoChecklist: photoChecklist.length ? photoChecklist : (seeded?.photoChecklist ?? [...DEFAULT_QA_PHOTOS]),
  };
}

function migrateLoadedState(parsed: PersistedDemoState): PersistedDemoState {
  const seed = createInitialStoreState();
  const ospreyStillOnRack =
    (parsed.reservations ?? []).some(
      (reservation) => reservation.id === "res-ds5-osprey" && reservation.berthId === "berth-ds5"
    ) && !(parsed.reservations ?? []).some((reservation) => reservation.id === "res-a10-osprey");

  return {
    ...seed,
    ...parsed,
    settings: {
      ...seed.settings,
      ...parsed.settings,
      checklistCategories:
        Array.isArray(parsed.settings?.checklistCategories) && parsed.settings.checklistCategories.length > 0
          ? parsed.settings.checklistCategories
          : [...DEFAULT_CHECKLIST_CATEGORIES],
    },
    kindFilter:
      Array.isArray(parsed.kindFilter) && parsed.kindFilter.length > 0
        ? parsed.kindFilter
        : [...DEFAULT_KIND_FILTER],
    selectedReservationId:
      parsed.selectedReservationId === "res-ds5-osprey" ? "res-a10-osprey" : parsed.selectedReservationId,
    selectedDate: DEMO_TODAY,
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
        storageStatus:
          ospreyStillOnRack && vessel.id === "ves-osprey" ? "stored" : vessel.storageStatus,
      };
    }),
    berths: (() => {
      const existing = parsed.berths ?? seed.berths;
      const byId = new Map(existing.map((berth) => [berth.id, berth]));
      const ordered = seed.berths.map((berth) => {
        const current = byId.get(berth.id);
        if (!current) return berth;
        return {
          ...current,
          name: berth.name,
          lengthM: berth.lengthM,
          beamM: berth.beamM,
        };
      });
      const seedIds = new Set(seed.berths.map((berth) => berth.id));
      for (const berth of existing) {
        if (!seedIds.has(berth.id)) ordered.push(berth);
      }
      return ordered;
    })(),
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
        checklist: (() => {
          const fallback = seeded?.kind === "retrieval" ? "Lift" : "Launch";
          const migrated = migrateChecklistOptions(taskType.checklist, fallback);
          return migrated.length ? migrated : (seeded?.checklist ?? []);
        })(),
        productId: taskType.productId ?? seeded?.productId,
      };
    }),
    launchTasks: (parsed.launchTasks ?? seed.launchTasks)
      .filter((task) => task.id !== "lt-in-osprey")
      .map((task) => {
      const taskType = seed.taskTypes.find((item) => item.id === task.taskTypeId);
      const seededTask = seed.launchTasks.find((item) => item.id === task.id);
      const fallback = taskType?.kind === "retrieval" ? "Lift" : "Launch";
      return {
        ...task,
        date: seededTask?.date ?? task.date,
        source: task.source ?? ("staff" as const),
        invoiceId: task.invoiceId,
        checklist: Array.isArray(task.checklist)
          ? task.checklist.map((item) => migrateChecklistItem(item, fallback))
          : [],
      };
    }),
    reservations: (parsed.reservations ?? seed.reservations).map((reservation) => {
      const relocated =
        ospreyStillOnRack && reservation.id === "res-ds5-osprey"
          ? {
              ...reservation,
              id: "res-a10-osprey",
              berthId: "berth-a10",
              startDate: DEMO_WEEK_START,
              endDate: DEMO_WEEK_END,
            }
          : reservation;
      const seeded = seed.reservations.find((item) => item.id === relocated.id);
      const dated = seeded
        ? {
            ...relocated,
            startDate: seeded.startDate,
            endDate: seeded.endDate,
            job:
              relocated.job && seeded.job
                ? { ...relocated.job, launchDate: seeded.job.launchDate ?? relocated.job.launchDate }
                : relocated.job,
          }
        : relocated;
      const withDefaults = withReservationDefaults(dated);
      if (!withDefaults.job) return withDefaults;
      return {
        ...withDefaults,
        job: {
          ...withDefaults.job,
          workBy: withDefaults.job.workBy ?? "marina",
          checklist: Array.isArray(withDefaults.job.checklist)
            ? withDefaults.job.checklist.map((item) => migrateChecklistItem(item, "Yard job"))
            : [],
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
