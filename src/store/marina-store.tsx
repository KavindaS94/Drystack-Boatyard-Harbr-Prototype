import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createInitialStoreState, clearDemoState, loadDemoState, saveDemoState, DEMO_STORAGE_KEY, type PersistedDemoState } from "../lib/demo-persist";
import { itemsFromOptions, photosFromOptions } from "../lib/checklist";
import { dnlStatus } from "../lib/dnl";
import { draftFromJob, draftFromLaunchTasks } from "../lib/invoice";
import { conflictDetailsForBerth, sourceReservationForVessel } from "../lib/availability";
import {
  equipmentForModule,
  findEquipmentConflict,
  formatDurationMinutes,
  minutesBetweenSlots,
  snapToSlot,
} from "../lib/equipment";
import { kindLabel } from "../lib/labels";
import { isDryKind, isLandKind, spaceKindToModule } from "../lib/modules";
import { statusAfterTaskDone } from "../lib/status";
import type {
  ActivityActor,
  ActivityEvent,
  ChangeRequestField,
  Equipment,
  EquipmentBooking,
  Job,
  JobType,
  LaunchTask,
  Message,
  MessageChannel,
  MessageTemplate,
  Product,
  ReservationStatus,
  Role,
  Settings,
  SpaceKind,
  TaskModule,
  TaskType,
  VesselStorageStatus,
  WorkBy,
} from "../types/domain";

export interface PlaceBookingInput {
  vesselId: string;
  destBerthId: string;
  start: string;
  end: string;
  mode: "keep" | "move";
  sourceReservationId?: string;
  jobTypeId?: string;
  liftTime?: string;
}

export interface AddLaunchTaskInput {
  taskTypeId: string;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
  source?: "staff" | "customer";
  reservationId?: string;
  asRequest?: boolean;
}

export interface AddYardStayInput {
  customerId: string;
  vesselId: string;
  berthId: string;
  reservationId: string;
  liftDate: string;
  launchDate: string;
  liftTime: string;
  launchTime: string;
  jobTypeId: string;
  workBy: WorkBy;
  contractorName?: string;
  notes?: string;
}

export interface AddDryStackOutingInput {
  customerId: string;
  vesselId: string;
  berthId: string;
  reservationId: string;
  launchDate: string;
  launchTime: string;
  liftDate: string;
  liftTime: string;
}

export interface RequestLaunchInput {
  taskTypeId: string;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
  reservationId?: string;
}

export interface SendMessageInput {
  customerId: string;
  channel: MessageChannel;
  template: MessageTemplate;
  subject: string;
  body: string;
}

export interface SubmitChangeRequestInput {
  customerId: string;
  vesselId?: string;
  fields: ChangeRequestField[];
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
  upsertEquipment: (equipment: Equipment) => void;
  updateJob: (reservationId: string, job: Job) => void;
  addJobLine: (reservationId: string, kind: "hours" | "materials", productId: string, qty: number) => void;
  createDraftFromJob: (reservationId: string) => string;
  createDraftFromDryStack: (reservationId: string) => string;
  placeBooking: (input: PlaceBookingInput) => boolean;
  addLaunchTask: (input: AddLaunchTaskInput) => boolean;
  addYardStay: (input: AddYardStayInput) => boolean;
  addDryStackOuting: (input: AddDryStackOutingInput) => boolean;
  toggleTaskCheck: (taskId: string, index: number) => void;
  setTaskChecklist: (taskId: string, checklist: { label: string; category: string; done: boolean }[]) => void;
  markTaskDone: (taskId: string) => void;
  startTask: (taskId: string) => void;
  logRequest: (input: RequestLaunchInput) => string | null;
  requestLaunch: (input: RequestLaunchInput) => string | null;
  approveRequest: (taskId: string) => boolean;
  declineRequest: (taskId: string, reason: string) => void;
  setVesselDeparted: (vesselId: string) => void;
  confirmDepartedByCustomer: (vesselId: string) => void;
  setReservationStatus: (reservationId: string, status: ReservationStatus) => void;
  archiveReservation: (reservationId: string) => void;
  sendStatusEmail: (customerId: string, vesselName?: string) => void;
  createPortalLink: (customerId: string) => { token: string; url: string; expiresAt: string };
  signTc: (reservationId: string) => void;
  sendTc: (reservationId: string) => void;
  updateInsuranceExpiry: (vesselId: string, expiry: string) => void;
  submitChangeRequest: (input: SubmitChangeRequestInput) => string;
  approveChangeRequest: (id: string) => void;
  rejectChangeRequest: (id: string, reason: string) => void;
  setDnlOverride: (vesselId: string, active: boolean, reason: string) => void;
  assignContractor: (reservationId: string, workBy: WorkBy, contractorName?: string) => void;
  notifyContractor: (reservationId: string) => void;
  rescheduleRelaunch: (reservationId: string, launchDate: string, launchTime?: string) => boolean;
  rescheduleTask: (taskId: string, date: string, time: string) => boolean;
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

function jobFromType(jobType: JobType, liftTime?: string): Job {
  return {
    typeId: jobType.id,
    location: "dockyard",
    workBy: "marina",
    liftTime,
    tcStatus: "not_sent",
    checklist: itemsFromOptions(jobType.checklist),
    photos: photosFromOptions(jobType.photoChecklist),
    hours: [],
    materials: [],
    status: "open",
  };
}

function yardJobFromStay(
  jobType: JobType,
  previous: Job | undefined,
  patch: {
    liftTime: string;
    launchTime: string;
    launchDate: string;
    workBy: WorkBy;
    contractorName?: string;
    notes?: string;
  }
): Job {
  const base =
    previous && previous.typeId === jobType.id
      ? previous
      : {
          ...jobFromType(jobType, patch.liftTime),
          hours: previous?.hours ?? [],
          materials: previous?.materials ?? [],
          tcStatus: previous?.tcStatus ?? "not_sent",
          tcSignedAt: previous?.tcSignedAt,
          status: previous?.status ?? "open",
          workBy: previous?.workBy ?? "marina",
          contractorName: previous?.contractorName,
          notes: previous?.notes,
          launchTime: previous?.launchTime,
          launchDate: previous?.launchDate,
        };
  return {
    ...base,
    workBy: patch.workBy,
    contractorName: patch.workBy === "contractor" ? patch.contractorName : undefined,
    notes: patch.notes?.trim() ? patch.notes.trim() : undefined,
    liftTime: patch.liftTime,
    launchTime: patch.launchTime,
    launchDate: patch.launchDate,
  };
}

function jobAfterMove(_current: Job | undefined, destKind: SpaceKind, yardJob?: Job): Job | undefined {
  if (destKind === "boatyard") return yardJob;
  return undefined;
}

function storageStatusAfterPlace(
  current: VesselStorageStatus,
  destKind: SpaceKind
): VesselStorageStatus {
  if (destKind === "wet" || isDryKind(destKind)) return "stored";
  return current;
}

function nowHhMm(): string {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function shouldRecordLiftFromWater(
  sourceKind: SpaceKind | undefined,
  destKind: SpaceKind,
  storageStatus: VesselStorageStatus
): boolean {
  if (!isDryKind(destKind)) return false;
  if (sourceKind) return false;
  return storageStatus === "launched" || storageStatus === "departed";
}

function completedLiftTask(input: {
  taskType: TaskType;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
  reservationId?: string;
}): LaunchTask {
  return {
    id: newId("lt"),
    taskTypeId: input.taskType.id,
    customerId: input.customerId,
    vesselId: input.vesselId,
    berthId: input.berthId,
    date: input.date,
    time: input.time,
    module: input.taskType.module,
    reservationId: input.reservationId,
    checklist: itemsFromOptions(input.taskType.checklist).map((item) => ({ ...item, done: true })),
    status: "done",
    source: "staff",
  };
}

function openLiftTask(input: {
  taskType: TaskType;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string;
  reservationId?: string;
}): LaunchTask {
  return {
    id: newId("lt"),
    taskTypeId: input.taskType.id,
    customerId: input.customerId,
    vesselId: input.vesselId,
    berthId: input.berthId,
    date: input.date,
    time: input.time,
    module: input.taskType.module,
    reservationId: input.reservationId,
    checklist: itemsFromOptions(input.taskType.checklist),
    status: "open",
    source: "staff",
  };
}

function tryBookSlot(
  bookings: EquipmentBooking[],
  equipment: Equipment[],
  task: Pick<LaunchTask, "id" | "module" | "date" | "time" | "vesselId">,
  excludeTaskId?: string
): { ok: true; bookings: EquipmentBooking[]; time: string } | { ok: false } {
  const machine = equipmentForModule(equipment, task.module);
  if (!machine) return { ok: true, bookings, time: task.time };
  const slot = snapToSlot(task.time, machine) ?? task.time;
  if (findEquipmentConflict(bookings, machine.id, task.date, slot, excludeTaskId ?? task.id)) {
    return { ok: false };
  }
  const rest = bookings.filter((item) => item.taskId !== task.id && item.taskId !== excludeTaskId);
  return {
    ok: true,
    time: slot,
    bookings: [
      ...rest,
      {
        id: newId("eb"),
        equipmentId: machine.id,
        date: task.date,
        startTime: slot,
        taskId: task.id,
        vesselId: task.vesselId,
      },
    ],
  };
}

function releaseSlot(bookings: EquipmentBooking[], taskId: string): EquipmentBooking[] {
  return bookings.filter((item) => item.taskId !== taskId);
}

function stayTaskForReservation(
  tasks: LaunchTask[],
  reservationId: string,
  taskTypeId: string
): LaunchTask | undefined {
  return tasks.find(
    (item) =>
      item.reservationId === reservationId &&
      item.taskTypeId === taskTypeId &&
      item.status !== "declined"
  );
}

function applyStayTask(
  prev: Pick<PersistedDemoState, "launchTasks" | "equipmentBookings" | "equipment">,
  input: {
    existing?: LaunchTask;
    type: TaskType;
    customerId: string;
    vesselId: string;
    berthId: string;
    reservationId: string;
    date: string;
    time: string;
  }
): { launchTasks: LaunchTask[]; equipmentBookings: EquipmentBooking[] } | null {
  if (input.existing?.status === "done") {
    if (input.existing.time !== input.time) return null;
    return { launchTasks: prev.launchTasks, equipmentBookings: prev.equipmentBookings };
  }
  const task = input.existing
    ? { ...input.existing, time: input.time, date: input.date, berthId: input.berthId, status: "open" as const }
    : openLiftTask({
        taskType: input.type,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        date: input.date,
        time: input.time,
        reservationId: input.reservationId,
      });
  const booked = tryBookSlot(prev.equipmentBookings, prev.equipment, task, input.existing?.id);
  if (!booked.ok) return null;
  const saved = { ...task, time: booked.time };
  return {
    launchTasks: upsertById(prev.launchTasks, saved),
    equipmentBookings: booked.bookings,
  };
}

function taskTypeFor(
  types: TaskType[],
  module: TaskModule,
  kind: TaskType["kind"]
): TaskType | undefined {
  return types.find((item) => item.module === module && item.kind === kind && item.active);
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

  const upsertEquipment = useCallback((equipment: Equipment) => {
    setState((prev) => ({ ...prev, equipment: upsertById(prev.equipment, equipment) }));
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
            channel: "email",
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
    const includeDockyardFee = reservation.job?.location === "dockyard";
    const lines = draftFromJob(reservation, current.products, includeDockyardFee);
    if (lines.length === 0) return "";
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

  const createDraftFromDryStack = useCallback((reservationId: string) => {
    const current = stateRef.current;
    const reservation = current.reservations.find((item) => item.id === reservationId);
    if (!reservation) throw new Error(`Unknown reservation ${reservationId}`);
    const billable = current.launchTasks.filter(
      (task) =>
        task.vesselId === reservation.vesselId &&
        task.status === "done" &&
        !task.invoiceId
    );
    const lines = draftFromLaunchTasks(billable, current.taskTypes, current.products);
    if (lines.length === 0) return "";
    const id = newId("inv");
    const billedIds = new Set(
      billable
        .filter((task) => {
          const taskType = current.taskTypes.find((item) => item.id === task.taskTypeId);
          const productId = taskType?.productId;
          return Boolean(productId && current.products.some((product) => product.id === productId));
        })
        .map((task) => task.id)
    );
    setState((prev) => ({
      ...prev,
      invoices: [...prev.invoices, { id, reservationId, customerId: reservation.customerId, lines }],
      launchTasks: prev.launchTasks.map((task) =>
        billedIds.has(task.id) ? { ...task, invoiceId: id } : task
      ),
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

  const placeBooking = useCallback((input: PlaceBookingInput): boolean => {
    let applied = false;
    setState((prev) => {
      const vessel = prev.vessels.find((item) => item.id === input.vesselId);
      const dest = prev.berths.find((item) => item.id === input.destBerthId);
      if (!vessel || !dest) return prev;
      if (input.start > input.end) return prev;

      const source = input.sourceReservationId
        ? prev.reservations.find((item) => item.id === input.sourceReservationId)
        : sourceReservationForVessel(prev.reservations, prev.berths, input.vesselId, dest.id);
      const destKind = dest.kind;
      const sourceBerthEarly = source ? prev.berths.find((item) => item.id === source.berthId) : undefined;
      if (sourceBerthEarly?.kind === "wet" && isLandKind(destKind)) return prev;
      const jobType = input.jobTypeId
        ? prev.jobTypes.find((item) => item.id === input.jobTypeId)
        : undefined;
      if (destKind === "boatyard" && !jobType) return prev;

      const excludeId = input.mode === "move" && source ? source.id : undefined;
      if (
        conflictDetailsForBerth(
          prev.reservations,
          prev.berths,
          dest.id,
          input.start,
          input.end,
          excludeId
        )
      ) {
        return prev;
      }

      const yardJob = destKind === "boatyard" && jobType ? jobFromType(jobType, input.liftTime) : undefined;
      const storageStatus = storageStatusAfterPlace(vessel.storageStatus, destKind);
      const actor = actorFromRole(prev.role);
      const destLabel = `${dest.name} · ${kindLabel(destKind, prev.settings)}`;
      const vessels = prev.vessels.map((item) =>
        item.id === vessel.id ? { ...item, storageStatus } : item
      );
      const sourceBerth = sourceBerthEarly;
      const destModule = spaceKindToModule(destKind);
      const liftType = destModule
        ? taskTypeFor(prev.taskTypes, destModule, "retrieval")
        : undefined;
      let liftTask: LaunchTask | undefined;
      if (destKind === "boatyard" && liftType) {
        liftTask = openLiftTask({
          taskType: liftType,
          customerId: vessel.customerId,
          vesselId: vessel.id,
          berthId: dest.id,
          date: input.start,
          time: input.liftTime || nowHhMm(),
        });
      } else if (
        liftType &&
        shouldRecordLiftFromWater(sourceBerth?.kind, destKind, vessel.storageStatus)
      ) {
        liftTask = completedLiftTask({
          taskType: liftType,
          customerId: vessel.customerId,
          vesselId: vessel.id,
          berthId: dest.id,
          date: input.start,
          time: input.liftTime || nowHhMm(),
        });
      }

      let equipmentBookings = prev.equipmentBookings;
      if (liftTask) {
        const booked = tryBookSlot(equipmentBookings, prev.equipment, liftTask);
        if (!booked.ok) return prev;
        liftTask = { ...liftTask, time: booked.time };
        equipmentBookings = booked.bookings;
        if (yardJob) yardJob.liftTime = booked.time;
      }

      const launchTasks = liftTask ? [...prev.launchTasks, liftTask] : prev.launchTasks;
      const liftActivity = liftTask
        ? [
            makeActivity(actor, `Lifted onto ${destLabel}`, {
              reservationId: source?.id,
              vesselId: vessel.id,
              customerId: vessel.customerId,
              taskId: liftTask.id,
            }),
          ]
        : [];

      if (input.mode === "move" && source) {
        applied = true;
        const linkedTasks = liftTask
          ? launchTasks.map((item) =>
              item.id === liftTask.id ? { ...item, reservationId: source.id } : item
            )
          : launchTasks;
        return {
          ...prev,
          selectedReservationId: source.id,
          vessels,
          launchTasks: linkedTasks,
          equipmentBookings,
          reservations: prev.reservations.map((item) =>
            item.id === source.id
              ? {
                  ...item,
                  berthId: dest.id,
                  startDate: input.start,
                  endDate: input.end,
                  job: jobAfterMove(item.job, destKind, yardJob),
                }
              : item
          ),
          activity: [
            ...liftActivity,
            makeActivity(actor, `Moved to ${destLabel}`, {
              reservationId: source.id,
              vesselId: vessel.id,
              customerId: vessel.customerId,
            }),
            ...prev.activity,
          ],
        };
      }

      const reservationId = newId("res");
      applied = true;
      const kept = Boolean(source);
      const linkedTasks = liftTask
        ? launchTasks.map((item) =>
            item.id === liftTask.id ? { ...item, reservationId } : item
          )
        : launchTasks;
      return {
        ...prev,
        selectedReservationId: reservationId,
        vessels,
        launchTasks: linkedTasks,
        equipmentBookings,
        reservations: [
          ...prev.reservations,
          {
            id: reservationId,
            berthId: dest.id,
            customerId: vessel.customerId,
            vesselId: vessel.id,
            startDate: input.start,
            endDate: input.end,
            status: "approved" as const,
            job: destKind === "boatyard" ? yardJob : undefined,
          },
        ],
        activity: [
          ...liftActivity.map((event) => ({ ...event, reservationId })),
          makeActivity(
            actor,
            kept ? `Booked ${destLabel} (kept previous space)` : `Booked ${destLabel}`,
            {
              reservationId,
              vesselId: vessel.id,
              customerId: vessel.customerId,
            }
          ),
          ...prev.activity,
        ],
      };
    });
    return applied;
  }, []);

  const addLaunchTask = useCallback((input: AddLaunchTaskInput): boolean => {
    let applied = false;
    setState((prev) => {
      const taskType = prev.taskTypes.find((item) => item.id === input.taskTypeId);
      if (!taskType) return prev;
      const taskId = newId("lt");
      const task: LaunchTask = {
        id: taskId,
        taskTypeId: input.taskTypeId,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        date: input.date,
        time: input.time,
        module: taskType.module,
        reservationId: input.reservationId,
        checklist: itemsFromOptions(taskType.checklist),
        status: input.asRequest ? "requested" : "open",
        source: input.source ?? (input.asRequest ? "customer" : "staff"),
      };
      const booked = tryBookSlot(prev.equipmentBookings, prev.equipment, task);
      if (!booked.ok) return prev;
      applied = true;
      const saved = { ...task, time: booked.time };
      return {
        ...prev,
        launchTasks: [...prev.launchTasks, saved],
        equipmentBookings: booked.bookings,
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `${taskType.name} ${input.asRequest ? "request logged" : "task booked"} for ${input.date} ${booked.time}`,
            {
              taskId,
              vesselId: input.vesselId,
              customerId: input.customerId,
              reservationId: input.reservationId,
            }
          ),
          ...prev.activity,
        ],
        messages: input.asRequest
          ? [
              makeMessage({
                customerId: input.customerId,
                channel: "email",
                template: "custom",
                subject: "Request received",
                body: `We received your ${taskType.name.toLowerCase()} request for ${input.date} at ${booked.time}. The marina will confirm shortly.`,
              }),
              ...prev.messages,
            ]
          : [
              makeMessage({
                customerId: input.customerId,
                channel: "email",
                template: "launch_confirmed",
                subject: `${taskType.name} booked`,
                body: `Your ${taskType.name.toLowerCase()} is booked for ${input.date} at ${booked.time}.`,
              }),
              ...prev.messages,
            ],
      };
    });
    return applied;
  }, []);

  const addYardStay = useCallback((input: AddYardStayInput): boolean => {
    let applied = false;
    setState((prev) => {
      const repairMinutes = minutesBetweenSlots(input.liftDate, input.liftTime, input.launchDate, input.launchTime);
      if (repairMinutes <= 0) return prev;
      const liftType = taskTypeFor(prev.taskTypes, "boatyard", "retrieval");
      const launchType = taskTypeFor(prev.taskTypes, "boatyard", "launch");
      const reservation = prev.reservations.find((item) => item.id === input.reservationId);
      const jobType = prev.jobTypes.find((item) => item.id === input.jobTypeId);
      const pad = prev.berths.find((item) => item.id === input.berthId);
      if (!liftType || !launchType || !reservation || !jobType || pad?.kind !== "boatyard") return prev;
      if (input.workBy === "contractor" && !input.contractorName?.trim()) return prev;
      if (
        conflictDetailsForBerth(
          prev.reservations,
          prev.berths,
          input.berthId,
          input.liftDate,
          input.launchDate,
          input.reservationId
        )
      ) {
        return prev;
      }

      const withLift = applyStayTask(prev, {
        existing: stayTaskForReservation(prev.launchTasks, input.reservationId, liftType.id),
        type: liftType,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        reservationId: input.reservationId,
        date: input.liftDate,
        time: input.liftTime,
      });
      if (!withLift) return prev;
      const withLaunch = applyStayTask(
        { ...prev, launchTasks: withLift.launchTasks, equipmentBookings: withLift.equipmentBookings },
        {
          existing: stayTaskForReservation(withLift.launchTasks, input.reservationId, launchType.id),
          type: launchType,
          customerId: input.customerId,
          vesselId: input.vesselId,
          berthId: input.berthId,
          reservationId: input.reservationId,
          date: input.launchDate,
          time: input.launchTime,
        }
      );
      if (!withLaunch) return prev;

      applied = true;
      const liftTask = withLaunch.launchTasks.find(
        (item) =>
          item.reservationId === input.reservationId &&
          item.taskTypeId === liftType.id &&
          item.status !== "declined"
      );
      const launchTask = withLaunch.launchTasks.find(
        (item) =>
          item.reservationId === input.reservationId &&
          item.taskTypeId === launchType.id &&
          item.status !== "declined"
      );
      const liftTime = liftTask?.time ?? input.liftTime;
      const launchTime = launchTask?.time ?? input.launchTime;
      const liftDate = liftTask?.date ?? input.liftDate;
      const launchDate = launchTask?.date ?? input.launchDate;
      const repair = formatDurationMinutes(
        minutesBetweenSlots(liftDate, liftTime, launchDate, launchTime)
      );
      const job = yardJobFromStay(jobType, reservation.job, {
        liftTime,
        launchTime,
        launchDate,
        workBy: input.workBy,
        contractorName: input.contractorName?.trim(),
        notes: input.notes,
      });
      const when =
        liftDate === launchDate
          ? `on ${liftDate}`
          : `lift ${liftDate} · launch ${launchDate}`;
      return {
        ...prev,
        launchTasks: withLaunch.launchTasks,
        equipmentBookings: withLaunch.equipmentBookings,
        reservations: prev.reservations.map((item) =>
          item.id === input.reservationId
            ? { ...item, berthId: input.berthId, startDate: liftDate, endDate: launchDate, job }
            : item
        ),
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `Lift ${liftTime} and launch ${launchTime} booked · ${jobType.name}${
              repair ? ` · ${repair} repair` : ""
            } · ${pad.name}`,
            {
              reservationId: input.reservationId,
              vesselId: input.vesselId,
              customerId: input.customerId,
            }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: input.customerId,
            channel: "email",
            template: "launch_confirmed",
            subject: "Lift and launch booked",
            body: `Your ${jobType.name.toLowerCase()} is booked: lift at ${liftTime} and launch at ${launchTime} ${when}${
              repair ? ` (${repair} on the yard)` : ""
            }.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return applied;
  }, []);

  const addDryStackOuting = useCallback((input: AddDryStackOutingInput): boolean => {
    let applied = false;
    setState((prev) => {
      const outingMinutes = minutesBetweenSlots(
        input.launchDate,
        input.launchTime,
        input.liftDate,
        input.liftTime
      );
      if (outingMinutes <= 0) return prev;
      const launchType = taskTypeFor(prev.taskTypes, "dry_storage", "launch");
      const liftType = taskTypeFor(prev.taskTypes, "dry_storage", "retrieval");
      const reservation = prev.reservations.find((item) => item.id === input.reservationId);
      const rack = prev.berths.find((item) => item.id === input.berthId);
      if (!launchType || !liftType || !reservation || rack?.kind !== "dry_storage") return prev;

      const launchTask = openLiftTask({
        taskType: launchType,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        date: input.launchDate,
        time: input.launchTime,
        reservationId: input.reservationId,
      });
      const bookedLaunch = tryBookSlot(prev.equipmentBookings, prev.equipment, launchTask);
      if (!bookedLaunch.ok) return prev;
      const savedLaunch = { ...launchTask, time: bookedLaunch.time };

      const liftTask = openLiftTask({
        taskType: liftType,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        date: input.liftDate,
        time: input.liftTime,
        reservationId: input.reservationId,
      });
      const bookedLift = tryBookSlot(bookedLaunch.bookings, prev.equipment, liftTask);
      if (!bookedLift.ok) return prev;
      const savedLift = { ...liftTask, time: bookedLift.time };

      applied = true;
      const outing = formatDurationMinutes(
        minutesBetweenSlots(savedLaunch.date, savedLaunch.time, savedLift.date, savedLift.time)
      );
      const when =
        savedLaunch.date === savedLift.date
          ? `on ${savedLaunch.date}`
          : `launch ${savedLaunch.date} · lift ${savedLift.date}`;
      return {
        ...prev,
        launchTasks: [...prev.launchTasks, savedLaunch, savedLift],
        equipmentBookings: bookedLift.bookings,
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `Launch ${savedLaunch.time} and lift ${savedLift.time} booked${outing ? ` · ${outing} in the water` : ""}`,
            {
              reservationId: input.reservationId,
              vesselId: input.vesselId,
              customerId: input.customerId,
            }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: input.customerId,
            channel: "email",
            template: "launch_confirmed",
            subject: "Launch and lift booked",
            body: `Your launch is booked at ${savedLaunch.time} and your lift back at ${savedLift.time} ${when}${
              outing ? ` (${outing} in the water)` : ""
            }.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return applied;
  }, []);

  const logRequest = useCallback((input: RequestLaunchInput): string | null => {
    const taskId = newId("lt");
    let saved = false;
    setState((prev) => {
      const taskType = prev.taskTypes.find((item) => item.id === input.taskTypeId);
      const vessel = prev.vessels.find((item) => item.id === input.vesselId);
      const customer = prev.customers.find((item) => item.id === input.customerId);
      if (!taskType || !vessel || !customer) return prev;
      if (dnlStatus(vessel, customer, prev.settings).blocked) return prev;
      const task: LaunchTask = {
        id: taskId,
        taskTypeId: input.taskTypeId,
        customerId: input.customerId,
        vesselId: input.vesselId,
        berthId: input.berthId,
        date: input.date,
        time: input.time,
        module: taskType.module,
        reservationId: input.reservationId,
        checklist: itemsFromOptions(taskType.checklist),
        status: "requested",
        source: "customer",
      };
      const booked = tryBookSlot(prev.equipmentBookings, prev.equipment, task);
      if (!booked.ok) return prev;
      saved = true;
      return {
        ...prev,
        launchTasks: [...prev.launchTasks, { ...task, time: booked.time }],
        equipmentBookings: booked.bookings,
        activity: [
          makeActivity(actorFromRole(prev.role), `Logged ${taskType.name} request for ${input.date} ${booked.time}`, {
            taskId,
            vesselId: input.vesselId,
            customerId: input.customerId,
          }),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: input.customerId,
            channel: "email",
            template: "custom",
            subject: "Request received",
            body: `We received your ${taskType.name.toLowerCase()} request for ${input.date} at ${booked.time}. The marina will confirm shortly.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return saved ? taskId : null;
  }, []);

  const requestLaunch = useCallback(
    (input: RequestLaunchInput) => logRequest(input),
    [logRequest]
  );

  const approveRequest = useCallback((taskId: string): boolean => {
    let applied = false;
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || task.status !== "requested") return prev;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      applied = true;
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
            channel: "email",
            template: "launch_confirmed",
            subject: `${taskType?.name ?? "Task"} confirmed`,
            body: `Your ${taskType?.name ?? "task"} is confirmed for ${task.date} at ${task.time}.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return applied;
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
        equipmentBookings: releaseSlot(prev.equipmentBookings, taskId),
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
            channel: "email",
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

  const setTaskChecklist = useCallback((taskId: string, checklist: { label: string; category: string; done: boolean }[]) => {
    setState((prev) => ({
      ...prev,
      launchTasks: prev.launchTasks.map((task) => (task.id === taskId ? { ...task, checklist } : task)),
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
            channel: "email",
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
      const nextStatus =
        taskType && task.module === "dry_storage"
          ? statusAfterTaskDone(taskType.kind, vessel?.storageStatus ?? "stored")
          : null;
      const archiveYard =
        task.module === "boatyard" &&
        taskType?.kind === "launch" &&
        Boolean(task.reservationId);
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, status: "done" } : item
        ),
        vessels: prev.vessels.map((item) => {
          if (item.id !== task.vesselId || !nextStatus) return item;
          return { ...item, storageStatus: nextStatus };
        }),
        reservations: archiveYard
          ? prev.reservations.map((item) =>
              item.id === task.reservationId
                ? { ...item, status: "archived" as const, endDate: task.date }
                : item
            )
          : prev.reservations,
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
            channel: "email",
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
          makeActivity("customer", "Confirmed departed", {
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

  const sendStatusEmail = useCallback((customerId: string, vesselName?: string) => {
    setState((prev) => ({
      ...prev,
      activity: [
        makeActivity(actorFromRole(prev.role), "Sent customer status email", { customerId }),
        ...prev.activity,
      ],
      messages: [
        makeMessage({
          customerId,
          channel: "email",
          template: "status_email",
          subject: vesselName ? `${vesselName} — marina update` : "Marina status update",
          body: vesselName
            ? `Here is the latest on ${vesselName}. Reply to this email if you need to change a launch or lift date.`
            : "Here is the latest on your boat. Reply to this email if you need to change a launch or lift date.",
        }),
        ...prev.messages,
      ],
    }));
  }, []);

  const createPortalLink = useCallback((customerId: string) => {
    sendStatusEmail(customerId);
    return { token: "", url: "", expiresAt: nowIso() };
  }, [sendStatusEmail]);

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
            body: "Please reply to this email to confirm you accept the yard terms before we lift your boat.",
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
          makeActivity(actorFromRole(prev.role), "T&Cs marked signed", {
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

  const submitChangeRequest = useCallback((input: SubmitChangeRequestInput) => {
    const id = newId("cr");
    setState((prev) => {
      const customer = prev.customers.find((item) => item.id === input.customerId);
      const vessel = input.vesselId
        ? prev.vessels.find((item) => item.id === input.vesselId)
        : undefined;
      const scopeKey = input.vesselId ?? "";
      const remaining = prev.changeRequests.filter(
        (item) =>
          !(
            item.customerId === input.customerId &&
            (item.vesselId ?? "") === scopeKey &&
            item.status === "pending"
          )
      );
      const summary = input.fields.map((field) => field.label).join(", ");
      return {
        ...prev,
        changeRequests: [
          {
            id,
            customerId: input.customerId,
            vesselId: input.vesselId,
            createdAt: nowIso(),
            status: "pending",
            fields: input.fields,
          },
          ...remaining,
        ],
        activity: [
          makeActivity(
            "customer",
            `Submitted changes for marina approval: ${summary}${vessel ? ` (${vessel.name})` : ""}`,
            { customerId: input.customerId, vesselId: input.vesselId }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: input.customerId,
            channel: "email",
            template: "custom",
            subject: "Changes submitted",
            body: `${customer?.name ?? "You"} submitted ${summary} for marina approval.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return id;
  }, []);

  const approveChangeRequest = useCallback((id: string) => {
    setState((prev) => {
      const request = prev.changeRequests.find((item) => item.id === id);
      if (!request || request.status !== "pending") return prev;
      const resolvedAt = nowIso();
      const customers = prev.customers.map((customer) => {
        if (customer.id !== request.customerId) return customer;
        const next = { ...customer };
        for (const field of request.fields) {
          if (field.key === "name") next.name = field.to;
          if (field.key === "email") next.email = field.to;
          if (field.key === "phone") next.phone = field.to;
        }
        return next;
      });
      const vessels = prev.vessels.map((vessel) => {
        if (request.vesselId && vessel.id !== request.vesselId) return vessel;
        if (!request.vesselId && vessel.customerId !== request.customerId) return vessel;
        const insurance = request.fields.find((field) => field.key === "insuranceExpiry");
        if (!insurance) return vessel;
        if (request.vesselId || vessel.id === request.vesselId) {
          return { ...vessel, insuranceExpiry: insurance.to };
        }
        return vessel;
      });
      const summary = request.fields.map((field) => field.label).join(", ");
      return {
        ...prev,
        customers,
        vessels,
        changeRequests: prev.changeRequests.map((item) =>
          item.id === id ? { ...item, status: "approved" as const, resolvedAt } : item
        ),
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `Approved owner changes: ${summary}`,
            { customerId: request.customerId, vesselId: request.vesselId }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: request.customerId,
            channel: "email",
            template: "change_approved",
            subject: "Your changes were approved",
            body: "Your changes were approved and are now on your account.",
          }),
          ...prev.messages,
        ],
      };
    });
  }, []);

  const rejectChangeRequest = useCallback((id: string, reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setState((prev) => {
      const request = prev.changeRequests.find((item) => item.id === id);
      if (!request || request.status !== "pending") return prev;
      return {
        ...prev,
        changeRequests: prev.changeRequests.map((item) =>
          item.id === id
            ? { ...item, status: "rejected" as const, rejectReason: trimmed, resolvedAt: nowIso() }
            : item
        ),
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `Rejected owner changes: ${trimmed}`,
            { customerId: request.customerId, vesselId: request.vesselId }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: request.customerId,
            channel: "email",
            template: "change_rejected",
            subject: "Please resubmit your changes",
            body: `The marina could not approve your changes: ${trimmed}. Please edit and resubmit.`,
          }),
          ...prev.messages,
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
                channel: "email",
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

  const rescheduleTask = useCallback((taskId: string, date: string, time: string): boolean => {
    let applied = false;
    setState((prev) => {
      const task = prev.launchTasks.find((item) => item.id === taskId);
      if (!task || task.status === "done" || task.status === "declined") return prev;
      const booked = tryBookSlot(prev.equipmentBookings, prev.equipment, { ...task, date, time }, task.id);
      if (!booked.ok) return prev;
      applied = true;
      const taskType = prev.taskTypes.find((item) => item.id === task.taskTypeId);
      const reservations = prev.reservations.map((item) => {
        if (item.id !== task.reservationId || !item.job) return item;
        const endDate = date > item.endDate ? date : item.endDate;
        if (taskType?.kind === "launch") {
          return { ...item, endDate, job: { ...item.job, launchDate: date, launchTime: booked.time } };
        }
        if (taskType?.kind === "retrieval") {
          return { ...item, job: { ...item.job, liftTime: booked.time } };
        }
        return item;
      });
      return {
        ...prev,
        launchTasks: prev.launchTasks.map((item) =>
          item.id === taskId ? { ...item, date, time: booked.time } : item
        ),
        equipmentBookings: booked.bookings,
        reservations,
        activity: [
          makeActivity(
            actorFromRole(prev.role),
            `${taskType?.name ?? "Task"} moved to ${date} ${booked.time}`,
            { taskId, vesselId: task.vesselId, customerId: task.customerId, reservationId: task.reservationId }
          ),
          ...prev.activity,
        ],
        messages: [
          makeMessage({
            customerId: task.customerId,
            channel: "email",
            template: "launch_rescheduled",
            subject: `${taskType?.name ?? "Task"} date updated`,
            body: `Your ${taskType?.name?.toLowerCase() ?? "task"} has been moved to ${date} at ${booked.time}.`,
          }),
          ...prev.messages,
        ],
      };
    });
    return applied;
  }, []);

  const rescheduleRelaunch = useCallback((reservationId: string, launchDate: string, launchTime?: string): boolean => {
    const prev = stateRef.current;
    const reservation = prev.reservations.find((item) => item.id === reservationId);
    if (!reservation?.job) return false;
    const existing = prev.launchTasks.find(
      (item) =>
        item.reservationId === reservationId &&
        item.module === "boatyard" &&
        prev.taskTypes.find((type) => type.id === item.taskTypeId)?.kind === "launch" &&
        item.status !== "declined" &&
        item.status !== "done"
    );
    const time = launchTime || reservation.job.launchTime || "09:00";
    if (existing) {
      return rescheduleTask(existing.id, launchDate, time);
    }
    const launchType = taskTypeFor(prev.taskTypes, "boatyard", "launch");
    if (!launchType) return false;
    return addLaunchTask({
      taskTypeId: launchType.id,
      customerId: reservation.customerId,
      vesselId: reservation.vesselId,
      berthId: reservation.berthId,
      date: launchDate,
      time,
      reservationId,
    });
  }, [addLaunchTask, rescheduleTask]);

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
    setState((prev) => {
      const current = prev.reservations.find((item) => item.id === reservationId);
      if (!current) return prev;
      const nextBerthId = patch.berthId ?? current.berthId;
      const nextStart = patch.startDate ?? current.startDate;
      const nextEnd = patch.endDate ?? current.endDate;
      const occupied = conflictDetailsForBerth(
        prev.reservations,
        prev.berths,
        nextBerthId,
        nextStart,
        nextEnd,
        reservationId
      );
      if (occupied) return prev;
      const fromBerth = prev.berths.find((item) => item.id === current.berthId);
      const toBerth = prev.berths.find((item) => item.id === nextBerthId);
      if (fromBerth?.kind === "wet" && toBerth && isLandKind(toBerth.kind)) return prev;
      const vessel = prev.vessels.find((item) => item.id === current.vesselId);
      const destKind = toBerth?.kind;
      const destModule = destKind ? spaceKindToModule(destKind) : null;
      const liftType = destModule ? taskTypeFor(prev.taskTypes, destModule, "retrieval") : undefined;
      const recordLift =
        Boolean(vessel && destKind && destModule) &&
        shouldRecordLiftFromWater(fromBerth?.kind, destKind ?? "wet", vessel?.storageStatus ?? "stored");
      const liftTask =
        recordLift && vessel && toBerth && liftType
          ? completedLiftTask({
              taskType: liftType,
              customerId: vessel.customerId,
              vesselId: vessel.id,
              berthId: toBerth.id,
              date: prev.selectedDate,
              time: nowHhMm(),
            })
          : undefined;
      let equipmentBookings = prev.equipmentBookings;
      let bookedLift = liftTask;
      if (bookedLift) {
        const booked = tryBookSlot(equipmentBookings, prev.equipment, bookedLift);
        if (!booked.ok) return prev;
        bookedLift = { ...bookedLift, time: booked.time };
        equipmentBookings = booked.bookings;
      }
      const nextStatus =
        vessel && destKind ? storageStatusAfterPlace(vessel.storageStatus, destKind) : undefined;
      return {
        ...prev,
        reservations: prev.reservations.map((item) =>
          item.id === reservationId ? { ...item, ...patch } : item
        ),
        vessels:
          vessel && nextStatus && nextStatus !== vessel.storageStatus
            ? prev.vessels.map((item) =>
                item.id === vessel.id ? { ...item, storageStatus: nextStatus } : item
              )
            : prev.vessels,
        launchTasks: bookedLift ? [...prev.launchTasks, bookedLift] : prev.launchTasks,
        equipmentBookings,
        activity: [
          ...(bookedLift && toBerth
            ? [
                makeActivity(
                  actorFromRole(prev.role),
                  `Lifted onto ${toBerth.name} · ${kindLabel(toBerth.kind, prev.settings)}`,
                  {
                    reservationId,
                    vesselId: vessel?.id,
                    customerId: vessel?.customerId,
                    taskId: bookedLift.id,
                  }
                ),
              ]
            : []),
          makeActivity(actorFromRole(prev.role), "Reservation edited", { reservationId }),
          ...prev.activity,
        ],
      };
    });
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
      upsertEquipment,
      updateJob,
      addJobLine,
      createDraftFromJob,
      createDraftFromDryStack,
      placeBooking,
      addLaunchTask,
      addYardStay,
      addDryStackOuting,
      toggleTaskCheck,
      setTaskChecklist,
      markTaskDone,
      startTask,
      logRequest,
      requestLaunch,
      approveRequest,
      declineRequest,
      setVesselDeparted,
      confirmDepartedByCustomer,
      setReservationStatus,
      archiveReservation,
      sendStatusEmail,
      createPortalLink,
      signTc,
      sendTc,
      updateInsuranceExpiry,
      submitChangeRequest,
      approveChangeRequest,
      rejectChangeRequest,
      setDnlOverride,
      assignContractor,
      notifyContractor,
      rescheduleRelaunch,
      rescheduleTask,
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
      upsertEquipment,
      updateJob,
      addJobLine,
      createDraftFromJob,
      createDraftFromDryStack,
      placeBooking,
      addLaunchTask,
      addYardStay,
      addDryStackOuting,
      toggleTaskCheck,
      setTaskChecklist,
      markTaskDone,
      startTask,
      logRequest,
      requestLaunch,
      approveRequest,
      declineRequest,
      setVesselDeparted,
      confirmDepartedByCustomer,
      setReservationStatus,
      archiveReservation,
      sendStatusEmail,
      createPortalLink,
      signTc,
      sendTc,
      updateInsuranceExpiry,
      submitChangeRequest,
      approveChangeRequest,
      rejectChangeRequest,
      setDnlOverride,
      assignContractor,
      notifyContractor,
      rescheduleRelaunch,
      rescheduleTask,
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
