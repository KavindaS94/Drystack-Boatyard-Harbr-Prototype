import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createInitialStoreState, clearDemoState, loadDemoState, saveDemoState, DEMO_STORAGE_KEY, type PersistedDemoState } from "../lib/demo-persist";
import { dnlStatus } from "../lib/dnl";
import { draftFromJob } from "../lib/invoice";
import { statusAfterTaskDone } from "../lib/status";
import type {
  ActivityActor,
  ActivityEvent,
  Job,
  JobType,
  Message,
  MessageChannel,
  MessageTemplate,
  Product,
  ReservationStatus,
  Role,
  Settings,
  SpaceKind,
  TaskType,
  WorkBy,
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
  source?: "staff" | "customer";
}

export interface RequestLaunchInput {
  taskTypeId: string;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
}

export interface SendMessageInput {
  customerId: string;
  channel: MessageChannel;
  template: MessageTemplate;
  subject: string;
  body: string;
}

export interface UpdateReservationInput {
  startDate?: string;
  endDate?: string;
  berthId?: string;
}

export type MarinaStoreState = PersistedDemoState;

export interface MarinaStore {
  state: MarinaStoreState;
  resetDemo: () => void;
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
  addAfloatJob: (reservationId: string) => void;
  addJobLine: (reservationId: string, kind: "hours" | "materials", productId: string, qty: number) => void;
  createDraftFromJob: (reservationId: string) => string;
  sendToYard: (input: SendToYardInput) => void;
  addLaunchTask: (input: AddLaunchTaskInput) => void;
  toggleTaskCheck: (taskId: string, index: number) => void;
  markTaskDone: (taskId: string) => void;
  startTask: (taskId: string) => void;
  requestLaunch: (input: RequestLaunchInput) => string;
  approveRequest: (taskId: string) => void;
  declineRequest: (taskId: string, reason: string) => void;
  setVesselDeparted: (vesselId: string) => void;
  confirmDepartedByCustomer: (vesselId: string) => void;
  setReservationStatus: (reservationId: string, status: ReservationStatus) => void;
  archiveReservation: (reservationId: string) => void;
  createPortalLink: (customerId: string) => { token: string; url: string; expiresAt: string };
  signTc: (reservationId: string) => void;
  sendTc: (reservationId: string) => void;
  updateInsuranceExpiry: (vesselId: string, expiry: string) => void;
  setDnlOverride: (vesselId: string, active: boolean, reason: string) => void;
  assignContractor: (reservationId: string, workBy: WorkBy, contractorName?: string) => void;
  notifyContractor: (reservationId: string) => void;
  rescheduleRelaunch: (reservationId: string, launchDate: string, launchTime?: string) => void;
  toggleJobPhoto: (reservationId: string, stage: "lift_out" | "relaunch") => void;
  sendMessage: (input: SendMessageInput) => void;
  updateReservation: (reservationId: string, patch: UpdateReservationInput) => void;
  updateNotes: (reservationId: string, notes: string) => void;
  setCustomerAccountOverdue: (customerId: string, overdue: boolean) => void;
}

const MarinaContext = createContext<MarinaStore | null>(null);

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function defaultPhotos(): Job["photos"] {
  return [
    { stage: "lift_out", done: false },
    { stage: "relaunch", done: false },
  ];
}

function jobFromType(
  jobType: JobType,
  liftTime?: string,
  location: Job["location"] = "dockyard"
): Job {
  return {
    typeId: jobType.id,
    location,
    workBy: "marina",
    liftTime,
    tcStatus: "not_sent",
    checklist: jobType.checklist.map((label) => ({ label, done: false })),
    photos: defaultPhotos(),
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

function makeActivity(
  actor: ActivityActor,
  message: string,
  refs: Partial<Pick<ActivityEvent, "reservationId" | "vesselId" | "taskId" | "customerId">> = {}
): ActivityEvent {
  return {
    id: newId("act"),
    at: nowIso(),
    actor,
    message,
    ...refs,
  };
}

function makeMessage(input: SendMessageInput): Message {
  return {
    id: newId("msg"),
    at: nowIso(),
    customerId: input.customerId,
    channel: input.channel,
    template: input.template,
    subject: input.subject,
    body: input.body,
    read: false,
  };
}

function actorFromRole(role: Role): ActivityActor {
  return role === "yard" ? "yard" : "office";
}

export function MarinaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarinaStoreState>(loadDemoState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveDemoState(state);
  }, [state]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== DEMO_STORAGE_KEY) return;
      setState(loadDemoState());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resetDemo = useCallback(() => {
    clearDemoState();
    setState(createInitialStoreState());
  }, []);

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
    setState((prev) => {
      const previous = prev.reservations.find((item) => item.id === reservationId);
      if (!previous) return prev;
      const becameDone = previous.job?.status !== "done" && job.status === "done";
      const becameSigned = previous.job?.tcStatus !== "signed" && job.tcStatus === "signed";
      const vessel = prev.vessels.find((item) => item.id === previous.vesselId);
      const extraActivity: ActivityEvent[] = [];
      const extraMessages: Message[] = [];

      if (becameDone) {
        extraActivity.push(
          makeActivity(actorFromRole(prev.role), "Job marked done", {
            reservationId,
            customerId: previous.customerId,
            vesselId: previous.vesselId,
          })
        );
        extraMessages.push(
          makeMessage({
            customerId: previous.customerId,
            channel: "sms",
            template: "boat_ready",
            subject: "Yard job complete",
            body: `${vessel?.name ?? "Your boat"} is ready — the yard job is complete.`,
          })
        );
      }
      if (becameSigned) {
        extraActivity.push(
          makeActivity(actorFromRole(prev.role), "T&Cs marked signed", {
            reservationId,
            customerId: previous.customerId,
            vesselId: previous.vesselId,
          })
        );
      }

      return {
        ...prev,
        reservations: prev.reservations.map((reservation) =>
          reservation.id === reservationId ? { ...reservation, job } : reservation
        ),
        activity: extraActivity.length ? [...extraActivity, ...prev.activity] : prev.activity,
        messages: extraMessages.length ? [...extraMessages, ...prev.messages] : prev.messages,
      };
    });
  }, []);

  const addAfloatJob = useCallback((reservationId: string) => {
    setState((prev) => {
      const jobType = prev.jobTypes.find((item) => item.active);
      if (!jobType) return prev;
      return {
        ...prev,
        reservations: prev.reservations.map((reservation) =>
          reservation.id === reservationId && !reservation.job
            ? { ...reservation, job: jobFromType(jobType, undefined, "afloat") }
            : reservation
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), "Afloat job added", { reservationId }),
          ...prev.activity,
        ],
      };
    });
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
      activity: [
        makeActivity(actorFromRole(prev.role), "Draft invoice created", {
          reservationId,
          customerId: reservation.customerId,
        }),
        ...prev.activity,
      ],
    }));
    return id;
  }, []);

  const sendToYard = useCallback((input: SendToYardInput) => {
    setState((prev) => {
      const wet = prev.reservations.find((item) => item.id === input.wetReservationId);
      const jobType = prev.jobTypes.find((item) => item.id === input.jobTypeId);
      if (!wet || !jobType) return prev;
      const job = jobFromType(jobType, input.liftTime);
      const actor = actorFromRole(prev.role);

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
          activity: [
            makeActivity(actor, `Moved to ${prev.settings.boatyardLabel}`, {
              reservationId: wet.id,
              vesselId: wet.vesselId,
              customerId: wet.customerId,
            }),
            ...prev.activity,
          ],
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
            status: "approved",
            job,
          },
        ],
        activity: [
          makeActivity(actor, `Sent to ${prev.settings.boatyardLabel} (kept wet berth)`, {
            reservationId: yardReservationId,
            vesselId: wet.vesselId,
            customerId: wet.customerId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const addLaunchTask = useCallback((input: AddLaunchTaskInput) => {
    setState((prev) => {
      const taskType = prev.taskTypes.find((item) => item.id === input.taskTypeId);
      if (!taskType) return prev;
      const taskId = newId("lt");
      return {
        ...prev,
        launchTasks: [
          ...prev.launchTasks,
          {
            id: taskId,
            taskTypeId: input.taskTypeId,
            customerId: input.customerId,
            vesselId: input.vesselId,
            berthId: input.berthId,
            date: input.date,
            time: input.time,
            checklist: taskType.checklist.map((label) => ({ label, done: false })),
            status: "open",
            source: input.source ?? "staff",
          },
        ],
        activity: [
          makeActivity(actorFromRole(prev.role), `${taskType.name} task booked for ${input.date} ${input.time}`, {
            taskId,
            vesselId: input.vesselId,
            customerId: input.customerId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const requestLaunch = useCallback((input: RequestLaunchInput) => {
    const taskId = newId("lt");
    setState((prev) => {
      if (!prev.settings.allowPortalRequests) return prev;
      const taskType = prev.taskTypes.find((item) => item.id === input.taskTypeId);
      const vessel = prev.vessels.find((item) => item.id === input.vesselId);
      const customer = prev.customers.find((item) => item.id === input.customerId);
      if (!taskType || !vessel || !customer) return prev;
      if (dnlStatus(vessel, customer, prev.settings).blocked) return prev;
      return {
        ...prev,
        launchTasks: [
          ...prev.launchTasks,
          {
            id: taskId,
            taskTypeId: input.taskTypeId,
            customerId: input.customerId,
            vesselId: input.vesselId,
            berthId: input.berthId,
            date: input.date,
            time: input.time,
            checklist: taskType.checklist.map((label) => ({ label, done: false })),
            status: "requested",
            source: "customer",
          },
        ],
        activity: [
          makeActivity("customer", `Requested ${taskType.name} for ${input.date} ${input.time}`, {
            taskId,
            vesselId: input.vesselId,
            customerId: input.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: input.customerId,
            channel: "sms",
            template: "custom",
            subject: "Request received",
            body: `We received your ${taskType.name.toLowerCase()} request for ${input.date} at ${input.time}. The marina will confirm shortly.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return taskId;
  }, []);

  const approveRequest = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || task.status !== "requested") return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "open" } : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), `Approved customer ${taskType?.name ?? "task"} request`, {
            taskId,
            vesselId: task.vesselId,
            customerId: task.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: task.customerId,
            channel: "sms",
            template: "launch_confirmed",
            subject: "Launch confirmed",
            body: `Your ${taskType?.name ?? "task"} is confirmed for ${task.date} at ${task.time}.`,
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const declineRequest = useCallback((taskId: string, reason: string) => {
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || task.status !== "requested") return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "declined", declineReason: reason } : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), `Declined customer request: ${reason}`, {
            taskId,
            vesselId: task.vesselId,
            customerId: task.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: task.customerId,
            channel: "sms",
            template: "launch_declined",
            subject: "Request declined",
            body: `Sorry — we couldn't schedule your ${taskType?.name ?? "task"} for ${task.date}. ${reason}`,
          }),
          ...prev.messages,
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

  const startTask = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || task.status !== "open") return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      const vessel = prev.vessels.find((item) => item.id === task.vesselId);
      const customer = prev.customers.find((item) => item.id === task.customerId);
      if (vessel && customer && dnlStatus(vessel, customer, prev.settings).blocked) return prev;
      const isLift = taskType?.kind === "retrieval";
      const verb = isLift ? "lifting" : "launching";
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "in_progress" } : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), `Started ${taskType?.name ?? "task"} — ${verb} now`, {
            taskId,
            vesselId: task.vesselId,
            customerId: task.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: task.customerId,
            channel: "sms",
            template: "launching_now",
            subject: isLift ? "Lifting now" : "Launching now",
            body: `We're ${verb} ${vessel?.name ?? "your boat"} now. Head to the marina when you're ready.`,
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const markTaskDone = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || (task.status !== "open" && task.status !== "in_progress")) return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      const vessel = prev.vessels.find((item) => item.id === task.vesselId);
      const customer = prev.customers.find((item) => item.id === task.customerId);
      if (vessel && customer && dnlStatus(vessel, customer, prev.settings).blocked) return prev;
      const nextStatus = taskType
        ? statusAfterTaskDone(taskType.kind, vessel?.storageStatus ?? "stored")
        : null;
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "done" } : item
        ),
        vessels: prev.vessels.map((item) => {
          if (item.id !== task.vesselId || !nextStatus) return item;
          return { ...item, storageStatus: nextStatus };
        }),
        activity: [
          makeActivity(actorFromRole(prev.role), `${taskType?.name ?? "Task"} done`, {
            taskId,
            vesselId: task.vesselId,
            customerId: task.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: task.customerId,
            channel: "sms",
            template: "boat_ready",
            subject: taskType?.kind === "launch" ? "Boat in the water" : "Boat back in storage",
            body:
              taskType?.kind === "launch"
                ? `${vessel?.name ?? "Your boat"} is in the water and ready for you.`
                : `${vessel?.name ?? "Your boat"} has been lifted back into storage.`,
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const setVesselDeparted = useCallback((vesselId: string) => {
    setState((prev) => {
      const vessel = prev.vessels.find((item) => item.id === vesselId);
      if (!vessel || vessel.storageStatus !== "launched") return prev;
      return {
        ...prev,
        vessels: prev.vessels.map((item) =>
          item.id === vesselId ? { ...item, storageStatus: "departed" } : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), "Marked departed", {
            vesselId,
            customerId: vessel.customerId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const confirmDepartedByCustomer = useCallback((vesselId: string) => {
    setState((prev) => {
      const vessel = prev.vessels.find((item) => item.id === vesselId);
      if (!vessel || vessel.storageStatus !== "launched") return prev;
      return {
        ...prev,
        vessels: prev.vessels.map((item) =>
          item.id === vesselId ? { ...item, storageStatus: "departed" } : item
        ),
        activity: [
          makeActivity("customer", "Confirmed departed via portal", {
            vesselId,
            customerId: vessel.customerId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const setReservationStatus = useCallback((reservationId: string, status: ReservationStatus) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status } : reservation
      ),
    }));
  }, []);

  const archiveReservation = useCallback((reservationId: string) => {
    setState((prev) => ({
      ...prev,
      selectedReservationId: prev.selectedReservationId === reservationId ? null : prev.selectedReservationId,
      reservations: prev.reservations.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status: "archived" } : reservation
      ),
    }));
  }, []);

  const createPortalLink = useCallback((customerId: string) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = addDaysIso(7);
    const createdAt = nowIso();
    setState((prev) => ({
      ...prev,
      portalLinks: [
        { id: newId("plink"), token, customerId, createdAt, expiresAt },
        ...prev.portalLinks,
      ],
      activity: [
        makeActivity(actorFromRole(prev.role), "Sent customer status link", { customerId }),
        ...prev.activity,
      ],
      messages: [
        makeMessage({
          customerId,
          channel: "sms",
          template: "portal_link",
          subject: "Your marina status link",
          body: `View your boat status and request a launch: ${window.location.origin}/portal/${token}`,
        }),
        ...prev.messages,
      ],
    }));
    return { token, url: `${window.location.origin}/portal/${token}`, expiresAt };
  }, []);

  const sendTc = useCallback((reservationId: string) => {
    setState((prev) => {
      const reservation = prev.reservations.find((item) => item.id === reservationId);
      if (!reservation?.job || reservation.job.tcStatus !== "not_sent") return prev;
      return {
        ...prev,
        reservations: prev.reservations.map((item) =>
          item.id === reservationId && item.job
            ? { ...item, job: { ...item.job, tcStatus: "sent" } }
            : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), "T&Cs sent to customer", {
            reservationId,
            customerId: reservation.customerId,
            vesselId: reservation.vesselId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: reservation.customerId,
            channel: "email",
            template: "tc_sent",
            subject: "Please sign yard T&Cs",
            body: "Please open your status link and sign the yard terms before we can lift your boat.",
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const signTc = useCallback((reservationId: string) => {
    setState((prev) => {
      const reservation = prev.reservations.find((item) => item.id === reservationId);
      if (!reservation?.job) return prev;
      const signedAt = nowIso();
      return {
        ...prev,
        reservations: prev.reservations.map((item) =>
          item.id === reservationId && item.job
            ? { ...item, job: { ...item.job, tcStatus: "signed", tcSignedAt: signedAt } }
            : item
        ),
        activity: [
          makeActivity("customer", "T&Cs signed via portal", {
            reservationId,
            customerId: reservation.customerId,
            vesselId: reservation.vesselId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const updateInsuranceExpiry = useCallback((vesselId: string, expiry: string) => {
    setState((prev) => {
      const vessel = prev.vessels.find((item) => item.id === vesselId);
      if (!vessel) return prev;
      return {
        ...prev,
        vessels: prev.vessels.map((item) =>
          item.id === vesselId ? { ...item, insuranceExpiry: expiry } : item
        ),
        activity: [
          makeActivity("customer", `Insurance expiry updated to ${expiry}`, {
            vesselId,
            customerId: vessel.customerId,
          }),
          ...prev.activity,
        ],
      };
    });
  }, []);

  const setDnlOverride = useCallback((vesselId: string, active: boolean, reason: string) => {
    setState((prev) => {
      const vessel = prev.vessels.find((item) => item.id === vesselId);
      if (!vessel) return prev;
      return {
        ...prev,
        vessels: prev.vessels.map((item) =>
          item.id === vesselId
            ? { ...item, dnlOverride: active ? { active: true, reason } : undefined }
            : item
        ),
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            active ? `Manual DNL set: ${reason}` : "Manual DNL cleared",
            { vesselId, customerId: vessel.customerId }
          ),
          ...prev.activity,
        ],
        messages: active
          ? [
              makeMessage({
                customerId: vessel.customerId,
                channel: "sms",
                template: "dnl_notice",
                subject: "Do not launch notice",
                body: `Your boat cannot be launched right now: ${reason}. Please contact the marina office.`,
              }),
              ...prev.messages,
            ]
          : prev.messages,
      };
    });
  }, []);

  const assignContractor = useCallback((reservationId: string, workBy: WorkBy, contractorName?: string) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((item) =>
        item.id === reservationId && item.job
          ? {
              ...item,
              job: {
                ...item.job,
                workBy,
                contractorName: workBy === "contractor" ? contractorName : undefined,
              },
            }
          : item
      ),
    }));
  }, []);

  const notifyContractor = useCallback((reservationId: string) => {
    setState((prev) => {
      const reservation = prev.reservations.find((item) => item.id === reservationId);
      if (!reservation?.job?.contractorName) return prev;
      const vessel = prev.vessels.find((item) => item.id === reservation.vesselId);
      return {
        ...prev,
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `Notified contractor ${reservation.job.contractorName}`,
            { reservationId, customerId: reservation.customerId, vesselId: reservation.vesselId }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: reservation.customerId,
            channel: "email",
            template: "contractor_notified",
            subject: `Contractor notified — ${vessel?.name ?? "vessel"}`,
            body: `${reservation.job.contractorName} has been notified of the booking for ${vessel?.name ?? "your boat"} (${reservation.startDate}–${reservation.endDate}).`,
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const rescheduleRelaunch = useCallback((reservationId: string, launchDate: string, launchTime?: string) => {
    setState((prev) => {
      const reservation = prev.reservations.find((item) => item.id === reservationId);
      if (!reservation?.job) return prev;
      const endDate = launchDate > reservation.endDate ? launchDate : reservation.endDate;
      return {
        ...prev,
        reservations: prev.reservations.map((item) =>
          item.id === reservationId && item.job
            ? {
                ...item,
                endDate,
                job: {
                  ...item.job,
                  launchDate,
                  launchTime: launchTime ?? item.job.launchTime,
                },
              }
            : item
        ),
        activity: [
          makeActivity(actorFromRole(prev.role), `Relaunch moved to ${launchDate}${launchTime ? ` ${launchTime}` : ""}`, {
            reservationId,
            customerId: reservation.customerId,
            vesselId: reservation.vesselId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: reservation.customerId,
            channel: "sms",
            template: "relaunch_moved",
            subject: "Relaunch date updated",
            body: `Your relaunch has been moved to ${launchDate}${launchTime ? ` at ${launchTime}` : ""}.`,
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const toggleJobPhoto = useCallback((reservationId: string, stage: "lift_out" | "relaunch") => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((item) => {
        if (item.id !== reservationId || !item.job) return item;
        const photos = item.job.photos.map((photo) =>
          photo.stage === stage ? { ...photo, done: !photo.done } : photo
        );
        return { ...item, job: { ...item.job, photos } };
      }),
    }));
  }, []);

  const sendMessage = useCallback((input: SendMessageInput) => {
    setState((prev) => ({
      ...prev,
      messages: [makeMessage(input), ...prev.messages],
      activity: [
        makeActivity(actorFromRole(prev.role), `Sent ${input.channel.toUpperCase()}: ${input.subject}`, {
          customerId: input.customerId,
        }),
        ...prev.activity,
      ],
    }));
  }, []);

  const updateReservation = useCallback((reservationId: string, patch: UpdateReservationInput) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((item) =>
        item.id === reservationId ? { ...item, ...patch } : item
      ),
      activity: [
        makeActivity(actorFromRole(prev.role), "Reservation edited", { reservationId }),
        ...prev.activity,
      ],
    }));
  }, []);

  const updateNotes = useCallback((reservationId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((item) =>
        item.id === reservationId ? { ...item, notes } : item
      ),
    }));
  }, []);

  const setCustomerAccountOverdue = useCallback((customerId: string, overdue: boolean) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((item) =>
        item.id === customerId ? { ...item, accountOverdue: overdue } : item
      ),
    }));
  }, []);

  const value = useMemo<MarinaStore>(
    () => ({
      state,
      resetDemo,
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
      addAfloatJob,
      addJobLine,
      createDraftFromJob,
      sendToYard,
      addLaunchTask,
      toggleTaskCheck,
      markTaskDone,
      startTask,
      requestLaunch,
      approveRequest,
      declineRequest,
      setVesselDeparted,
      confirmDepartedByCustomer,
      setReservationStatus,
      archiveReservation,
      createPortalLink,
      signTc,
      sendTc,
      updateInsuranceExpiry,
      setDnlOverride,
      assignContractor,
      notifyContractor,
      rescheduleRelaunch,
      toggleJobPhoto,
      sendMessage,
      updateReservation,
      updateNotes,
      setCustomerAccountOverdue,
    }),
    [
      state,
      resetDemo,
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
      addAfloatJob,
      addJobLine,
      createDraftFromJob,
      sendToYard,
      addLaunchTask,
      toggleTaskCheck,
      markTaskDone,
      startTask,
      requestLaunch,
      approveRequest,
      declineRequest,
      setVesselDeparted,
      confirmDepartedByCustomer,
      setReservationStatus,
      archiveReservation,
      createPortalLink,
      signTc,
      sendTc,
      updateInsuranceExpiry,
      setDnlOverride,
      assignContractor,
      notifyContractor,
      rescheduleRelaunch,
      toggleJobPhoto,
      sendMessage,
      updateReservation,
      updateNotes,
      setCustomerAccountOverdue,
    ]
  );

  return <MarinaContext.Provider value={value}>{children}</MarinaContext.Provider>;
}

export function useMarina(): MarinaStore {
  const context = useContext(MarinaContext);
  if (!context) throw new Error("useMarina must be used within MarinaProvider");
  return context;
}
