export type SpaceKind = "wet" | "boatyard" | "dry_storage";
export type Role = "office" | "yard";
export type BankAccount = "Marina" | "Holding";
export type TcStatus = "not_sent" | "sent" | "signed";
export type JobStatus = "open" | "done";
/** Where the work happens: afloat = in the water at the berth; dockyard = lifted out. */
export type JobLocation = "afloat" | "dockyard";
export type VesselStorageStatus = "stored" | "launched" | "departed";
export type LaunchTaskStatus = "open" | "done";

export interface Product {
  id: string;
  name: string;
  unitType: "HOUR" | "UNIT" | "DAY" | "LITER";
  unitPrice: number;
  bankAccount: BankAccount;
  active: boolean;
}

export interface JobType {
  id: string;
  name: string;
  colour: string;
  defaultDurationDays: number;
  checklist: string[];
  productIds: string[];
  requiresTc: boolean;
  active: boolean;
}

export interface TaskType {
  id: string;
  name: string; // marina word, e.g. Launch / Lift
  kind: "launch" | "retrieval" | "other";
  checklist: string[];
  productId?: string;
  active: boolean;
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
}

export interface Vessel {
  id: string;
  name: string;
  customerId: string;
  lengthM: number;
  beamM: number;
  weightT?: number;
  storageStatus: VesselStorageStatus;
}

export interface JobLine {
  id: string;
  productId: string;
  qty: number;
  staffName?: string;
}

export interface Job {
  typeId: string;
  location: JobLocation; // afloat (in the water) | dockyard (lifted out)
  liftTime?: string; // "08:15" — only meaningful when location === "dockyard"
  launchTime?: string; // "14:00"
  tcStatus: TcStatus;
  checklist: { label: string; done: boolean }[];
  hours: JobLine[];
  materials: JobLine[];
  status: JobStatus;
}

export interface Reservation {
  id: string;
  berthId: string;
  customerId: string;
  vesselId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
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
  checklist: { label: string; done: boolean }[];
  status: LaunchTaskStatus;
}

export interface DraftInvoice {
  id: string;
  reservationId?: string;
  customerId: string;
  lines: { productId: string; qty: number; unitPrice: number; bankAccount: BankAccount }[];
}

export interface Settings {
  boatyardEnabled: boolean;
  dryStorageEnabled: boolean;
  boatyardLabel: string; // default "Dockyard"
  dryStorageLabel: string; // default "Dry stack"
  jobPanelTitle: string; // default "Job"
  hidePricesForYard: boolean;
}

export interface MarinaState {
  settings: Settings;
  role: Role;
  berths: Berth[];
  products: Product[];
  jobTypes: JobType[];
  taskTypes: TaskType[];
  customers: Customer[];
  vessels: Vessel[];
  reservations: Reservation[];
  launchTasks: LaunchTask[];
  invoices: DraftInvoice[];
  selectedReservationId: string | null;
  selectedDate: string; // calendar / launch board day
}
