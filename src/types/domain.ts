export type SpaceKind = "wet" | "boatyard" | "dry_storage";
export type LandModule = "dry_storage" | "boatyard";
export type TaskModule = LandModule | "other";
export type EquipmentKind = "travel_lift" | "fork_lift";
export type Role = "office" | "yard";
export type BankAccount = "Marina" | "Holding";
export type TcStatus = "not_sent" | "sent" | "signed";
export type JobStatus = "open" | "done";
/** Where the work happens: afloat = in the water at the berth; dockyard = lifted out. */
export type JobLocation = "afloat" | "dockyard";
export type WorkBy = "marina" | "diy" | "contractor";
export type VesselStorageStatus = "stored" | "launched" | "departed";
export type LaunchTaskStatus = "requested" | "open" | "in_progress" | "done" | "declined";
export type LaunchTaskSource = "staff" | "customer";
export type ActivityActor = "office" | "yard" | "customer" | "system";
export type MessageChannel = "email" | "sms";
export type MessageTemplate =
  | "portal_link"
  | "status_email"
  | "dnl_notice"
  | "payment_reminder"
  | "insurance_reminder"
  | "boat_ready"
  | "launch_confirmed"
  | "launch_declined"
  | "launching_now"
  | "tc_sent"
  | "contractor_notified"
  | "relaunch_moved"
  | "launch_rescheduled"
  | "change_approved"
  | "change_rejected"
  | "custom";

export interface Product {
  id: string;
  name: string;
  unitType: "HOUR" | "UNIT" | "DAY" | "LITER";
  unitPrice: number;
  bankAccount: BankAccount;
  active: boolean;
}

export interface ChecklistOption {
  label: string;
  category: string;
}

export interface ChecklistItem {
  label: string;
  category: string;
  done: boolean;
}

export interface JobType {
  id: string;
  name: string;
  colour: string;
  defaultDurationDays: number;
  checklist: ChecklistOption[];
  /** QA photo prompts copied onto each new job. Empty = none unless staff add some on the job. */
  photoChecklist: ChecklistOption[];
  productIds: string[];
  requiresTc: boolean;
  active: boolean;
}

export interface TaskType {
  id: string;
  name: string; // marina word, e.g. Launch / Lift
  kind: "launch" | "retrieval" | "other";
  module: TaskModule;
  checklist: ChecklistOption[];
  productId?: string;
  active: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  kind: EquipmentKind;
  active: boolean;
  dayStart: string; // "07:00"
  dayEnd: string; // "17:00"
  slotMinutes: number;
}

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  date: string;
  startTime: string;
  taskId: string;
  vesselId: string;
}

export interface Berth {
  id: string;
  name: string;
  pier: string;
  kind: SpaceKind;
  lengthM: number;
  beamM: number;
  maxWeightT?: number;
  hasPower: boolean;
  underCover: boolean;
  blocksTravelLift: boolean;
  priceClassName: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountOverdue: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  customerId: string;
  lengthM: number;
  beamM: number;
  weightT?: number;
  storageStatus: VesselStorageStatus;
  insuranceExpiry: string; // YYYY-MM-DD
  dnlOverride?: { active: boolean; reason: string };
}

export interface JobLine {
  id: string;
  productId: string;
  qty: number;
  staffName?: string;
}

export interface JobPhoto {
  id: string;
  label: string;
  category: string;
  done: boolean;
}

export interface Job {
  typeId: string;
  location: JobLocation; // afloat (in the water) | dockyard (lifted out)
  workBy: WorkBy;
  contractorName?: string;
  notes?: string;
  liftTime?: string; // "08:15" — mirror of the linked Lift task
  launchTime?: string; // "14:00"
  launchDate?: string; // YYYY-MM-DD — relaunch day
  tcStatus: TcStatus;
  tcSignedAt?: string;
  checklist: ChecklistItem[];
  photos: JobPhoto[];
  hours: JobLine[];
  materials: JobLine[];
  status: JobStatus;
}

/** Matches Harbr’s calendar card labels (Draft → Pending, Submitted → To be approved). */
export type ReservationStatus = "pending" | "to_be_approved" | "approved" | "archived";

export interface Reservation {
  id: string;
  berthId: string;
  customerId: string;
  vesselId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: ReservationStatus;
  notes?: string;
  job?: Job; // only when berth.kind === "boatyard"
}

export interface LaunchTask {
  id: string;
  taskTypeId: string;
  customerId: string;
  vesselId: string;
  berthId: string;
  date: string;
  time: string; // "09:00"
  module: TaskModule;
  reservationId?: string;
  checklist: ChecklistItem[];
  status: LaunchTaskStatus;
  source: LaunchTaskSource;
  declineReason?: string;
  invoiceId?: string;
}

export interface DraftInvoice {
  id: string;
  reservationId?: string;
  customerId: string;
  lines: { productId: string; qty: number; unitPrice: number; bankAccount: BankAccount }[];
}

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface ChangeRequestField {
  key: string;
  label: string;
  from: string;
  to: string;
}

export interface ChangeRequest {
  id: string;
  customerId: string;
  vesselId?: string;
  createdAt: string;
  status: ChangeRequestStatus;
  fields: ChangeRequestField[];
  rejectReason?: string;
  resolvedAt?: string;
}

export interface PortalLink {
  id: string;
  token: string;
  customerId: string;
  createdAt: string;
  expiresAt: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: ActivityActor;
  message: string;
  reservationId?: string;
  vesselId?: string;
  taskId?: string;
  customerId?: string;
}

export interface Message {
  id: string;
  at: string;
  customerId: string;
  channel: MessageChannel;
  template: MessageTemplate;
  subject: string;
  body: string;
  read: boolean;
}

export interface Settings {
  boatyardEnabled: boolean;
  dryStorageEnabled: boolean;
  boatyardLabel: string; // default "Dockyard"
  dryStorageLabel: string; // default "Dry stack"
  jobPanelTitle: string; // default "Job"
  hidePricesForYard: boolean;
  autoDnlOverdue: boolean;
  autoDnlInsurance: boolean;
  /** Subtitle options on checklist rows — set in Settings → Checklists. */
  checklistCategories: string[];
}

export interface MarinaState {
  settings: Settings;
  role: Role;
  berths: Berth[];
  products: Product[];
  jobTypes: JobType[];
  taskTypes: TaskType[];
  equipment: Equipment[];
  equipmentBookings: EquipmentBooking[];
  customers: Customer[];
  vessels: Vessel[];
  reservations: Reservation[];
  launchTasks: LaunchTask[];
  invoices: DraftInvoice[];
  portalLinks: PortalLink[];
  changeRequests: ChangeRequest[];
  activity: ActivityEvent[];
  messages: Message[];
  selectedReservationId: string | null;
  selectedDate: string; // calendar / launch board day
}
