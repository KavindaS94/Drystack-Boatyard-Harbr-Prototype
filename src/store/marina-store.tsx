import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createSeedState } from "../data/seed";
import { draftFromJob } from "../lib/invoice";
import { statusAfterTaskDone } from "../lib/status";
import type {
  Job,
  JobType,
  MarinaState,
  Product,
  Role,
  Settings,
  SpaceKind,
  TaskType,
} from "../types/domain";

export interface SendToYardInput {
  wetReservationId: string;
  yardBerthId: string;
  start: string;
  end: string;
  jobTypeId: string;
  liftTime: string;
  mode: "keep_wet" | "move";
}

export interface AddLaunchTaskInput {
  taskTypeId: string;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
}

export type MarinaStoreState = MarinaState & { kindFilter: SpaceKind[] };

export interface MarinaStore {
  state: MarinaStoreState;
  setRole: (role: Role) => void;
  setSelectedReservationId: (id: string | null) => void;
  setSelectedDate: (date: string) => void;
  setKindFilter: (kinds: SpaceKind[]) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  updateBerthKind: (berthId: string, kind: SpaceKind) => void;
  upsertJobType: (jobType: JobType) => void;
  upsertTaskType: (taskType: TaskType) => void;
  upsertProduct: (product: Product) => void;
  updateJob: (reservationId: string, job: Job) => void;
  addJobLine: (reservationId: string, kind: "hours" | "materials", productId: string, qty: number) => void;
  createDraftFromJob: (reservationId: string) => string;
  sendToYard: (input: SendToYardInput) => void;
  addLaunchTask: (input: AddLaunchTaskInput) => void;
  toggleTaskCheck: (taskId: string, index: number) => void;
  markTaskDone: (taskId: string) => void;
  setVesselDeparted: (vesselId: string) => void;
}

const MarinaContext = createContext<MarinaStore | null>(null);

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function jobFromType(jobType: JobType, liftTime?: string): Job {
  return {
    typeId: jobType.id,
    liftTime,
    tcStatus: "not_sent",
    checklist: jobType.checklist.map((label) => ({ label, done: false })),
    hours: [],
    materials: [],
    status: "open",
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) return [...items, item];
  return items.map((existing, i) => (i === index ? item : existing));
}

export function MarinaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarinaStoreState>(() => ({
    ...createSeedState(),
    kindFilter: ["wet", "boatyard", "dry_storage"],
  }));
  const stateRef = useRef(state);
  stateRef.current = state;

  const setRole = useCallback((role: Role) => {
    setState((prev) => ({ ...prev, role }));
  }, []);

  const setSelectedReservationId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedReservationId: id }));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }, []);

  const setKindFilter = useCallback((kinds: SpaceKind[]) => {
    setState((prev) => ({ ...prev, kindFilter: kinds }));
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }, []);

  const updateBerthKind = useCallback((berthId: string, kind: SpaceKind) => {
    setState((prev) => ({
      ...prev,
      berths: prev.berths.map((berth) => (berth.id === berthId ? { ...berth, kind } : berth)),
    }));
  }, []);

  const upsertJobType = useCallback((jobType: JobType) => {
    setState((prev) => ({ ...prev, jobTypes: upsertById(prev.jobTypes, jobType) }));
  }, []);

  const upsertTaskType = useCallback((taskType: TaskType) => {
    setState((prev) => ({ ...prev, taskTypes: upsertById(prev.taskTypes, taskType) }));
  }, []);

  const upsertProduct = useCallback((product: Product) => {
    setState((prev) => ({ ...prev, products: upsertById(prev.products, product) }));
  }, []);

  const updateJob = useCallback((reservationId: string, job: Job) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, job } : reservation
      ),
    }));
  }, []);

  const addJobLine = useCallback((
    reservationId: string,
    kind: "hours" | "materials",
    productId: string,
    qty: number
  ) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((reservation) => {
        if (reservation.id !== reservationId || !reservation.job) return reservation;
        const line = { id: newId("line"), productId, qty };
        return {
          ...reservation,
          job: { ...reservation.job, [kind]: [...reservation.job[kind], line] },
        };
      }),
    }));
  }, []);

  const createDraftFromJob = useCallback((reservationId: string) => {
    const current = stateRef.current;
    const reservation = current.reservations.find((item) => item.id === reservationId);
    if (!reservation) throw new Error(`Unknown reservation ${reservationId}`);
    const lines = draftFromJob(reservation, current.products, true);
    const id = newId("inv");
    setState((prev) => ({
      ...prev,
      invoices: [...prev.invoices, { id, reservationId, customerId: reservation.customerId, lines }],
    }));
    return id;
  }, []);

  const sendToYard = useCallback((input: SendToYardInput) => {
    setState((prev) => {
      const wet = prev.reservations.find((item) => item.id === input.wetReservationId);
      const jobType = prev.jobTypes.find((item) => item.id === input.jobTypeId);
      if (!wet || !jobType) return prev;
      const job = jobFromType(jobType, input.liftTime);

      if (input.mode === "move") {
        return {
          ...prev,
          selectedReservationId: wet.id,
          reservations: prev.reservations.map((item) =>
            item.id === wet.id
              ? {
                  ...item,
                  berthId: input.yardBerthId,
                  startDate: input.start,
                  endDate: input.end,
                  job,
                }
              : item
          ),
        };
      }

      const yardReservationId = newId("res");
      return {
        ...prev,
        selectedReservationId: yardReservationId,
        reservations: [
          ...prev.reservations,
          {
            id: yardReservationId,
            berthId: input.yardBerthId,
            customerId: wet.customerId,
            vesselId: wet.vesselId,
            startDate: input.start,
            endDate: input.end,
            job,
          },
        ],
      };
    });
  }, []);

  const addLaunchTask = useCallback((input: AddLaunchTaskInput) => {
    setState((prev) => {
      const taskType = prev.taskTypes.find((item) => item.id === input.taskTypeId);
      if (!taskType) return prev;
      return {
        ...prev,
        launchTasks: [
          ...prev.launchTasks,
          {
            id: newId("lt"),
            taskTypeId: input.taskTypeId,
            customerId: input.customerId,
            vesselId: input.vesselId,
            berthId: input.berthId,
            date: input.date,
            time: input.time,
            checklist: taskType.checklist.map((label) => ({ label, done: false })),
            status: "open",
          },
        ],
      };
    });
  }, []);

  const toggleTaskCheck = useCallback((taskId: string, index: number) => {
    setState((prev) => ({
      ...prev,
      launchTasks: prev.launchTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          checklist: task.checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item)),
        };
      }),
    }));
  }, []);

  const markTaskDone = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task) return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "done" } : item
        ),
        vessels: prev.vessels.map((vessel) => {
          if (vessel.id !== task.vesselId || !taskType) return vessel;
          const next = statusAfterTaskDone(taskType.kind, vessel.storageStatus);
          return next ? { ...vessel, storageStatus: next } : vessel;
        }),
      };
    });
  }, []);

  const setVesselDeparted = useCallback((vesselId: string) => {
    setState((prev) => ({
      ...prev,
      vessels: prev.vessels.map((vessel) => {
        if (vessel.id !== vesselId || vessel.storageStatus !== "launched") return vessel;
        return { ...vessel, storageStatus: "departed" };
      }),
    }));
  }, []);

  const value = useMemo<MarinaStore>(
    () => ({
      state,
      setRole,
      setSelectedReservationId,
      setSelectedDate,
      setKindFilter,
      updateSettings,
      updateBerthKind,
      upsertJobType,
      upsertTaskType,
      upsertProduct,
      updateJob,
      addJobLine,
      createDraftFromJob,
      sendToYard,
      addLaunchTask,
      toggleTaskCheck,
      markTaskDone,
      setVesselDeparted,
    }),
    [
      state,
      setRole,
      setSelectedReservationId,
      setSelectedDate,
      setKindFilter,
      updateSettings,
      updateBerthKind,
      upsertJobType,
      upsertTaskType,
      upsertProduct,
      updateJob,
      addJobLine,
      createDraftFromJob,
      sendToYard,
      addLaunchTask,
      toggleTaskCheck,
      markTaskDone,
      setVesselDeparted,
    ]
  );

  return <MarinaContext.Provider value={value}>{children}</MarinaContext.Provider>;
}

export function useMarina(): MarinaStore {
  const context = useContext(MarinaContext);
  if (!context) throw new Error("useMarina must be used within MarinaProvider");
  return context;
}
