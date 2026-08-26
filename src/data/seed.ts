import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { itemsFromLabels, photosFromLabels } from "../lib/checklist";
import type {
  ActivityEvent,
  Berth,
  Customer,
  Job,
  JobType,
  LaunchTask,
  MarinaState,
  Message,
  PortalLink,
  Product,
  Reservation,
  Settings,
  TaskType,
  Vessel,
} from "../types/domain";

const SETTINGS: Settings = {
  boatyardEnabled: true,
  dryStorageEnabled: true,
  boatyardLabel: "Dockyard",
  dryStorageLabel: "Dry stack",
  jobPanelTitle: "Job",
  hidePricesForYard: true,
  autoDnlOverdue: true,
  autoDnlInsurance: true,
  allowPortalRequests: true,
};

const PRODUCTS: Product[] = [
  { id: "prod-wet-night", name: "Berth night", unitType: "DAY", unitPrice: 85, bankAccount: "Marina", active: true },
  { id: "prod-dockyard-fee", name: "Dockyard fee", unitType: "DAY", unitPrice: 120, bankAccount: "Holding", active: true },
  { id: "prod-labour-hour", name: "Labour hour", unitType: "HOUR", unitPrice: 95, bankAccount: "Holding", active: true },
  { id: "prod-disc-anode", name: "Disc anode", unitType: "UNIT", unitPrice: 45, bankAccount: "Holding", active: true },
  { id: "prod-travel-lift", name: "Travel lift", unitType: "UNIT", unitPrice: 350, bankAccount: "Holding", active: true },
  { id: "prod-boat-wash", name: "Boat wash", unitType: "UNIT", unitPrice: 80, bankAccount: "Holding", active: true },
  { id: "prod-launch", name: "Launch", unitType: "UNIT", unitPrice: 85, bankAccount: "Marina", active: true },
  { id: "prod-lift", name: "Lift", unitType: "UNIT", unitPrice: 85, bankAccount: "Marina", active: true },
];

const QA_PHOTOS = ["Lift-out photo taken", "Relaunch photo taken"];

const JOB_TYPES: JobType[] = [
  {
    id: "jt-antifoul",
    name: "Antifoul",
    colour: "#f59e0b",
    defaultDurationDays: 5,
    checklist: ["Wash hull", "Mask fittings", "Apply antifoul"],
    photoChecklist: [...QA_PHOTOS],
    productIds: ["prod-labour-hour", "prod-disc-anode", "prod-dockyard-fee"],
    requiresTc: false,
    active: true,
  },
  {
    id: "jt-diy",
    name: "DIY",
    colour: "#3b82f6",
    defaultDurationDays: 3,
    checklist: ["Site induction", "Stands in place"],
    photoChecklist: [...QA_PHOTOS],
    productIds: ["prod-labour-hour", "prod-dockyard-fee"],
    requiresTc: false,
    active: true,
  },
  {
    id: "jt-travel-lift",
    name: "Travel lift",
    colour: "#14b8a6",
    defaultDurationDays: 1,
    checklist: ["Path clear", "Straps checked", "Lift complete"],
    photoChecklist: [...QA_PHOTOS],
    productIds: ["prod-travel-lift", "prod-labour-hour"],
    requiresTc: true,
    active: true,
  },
  {
    id: "jt-engine",
    name: "Engine service",
    colour: "#0ea5e9",
    defaultDurationDays: 2,
    checklist: ["Isolate batteries", "Drain coolant", "Service log"],
    photoChecklist: [],
    productIds: ["prod-labour-hour"],
    requiresTc: false,
    active: true,
  },
];

const TASK_TYPES: TaskType[] = [
  {
    id: "tt-launch",
    name: "Launch",
    kind: "launch",
    checklist: ["Check straps", "Engine ok"],
    productId: "prod-launch",
    active: true,
  },
  {
    id: "tt-retrieval",
    name: "Lift",
    kind: "retrieval",
    checklist: ["Rinse hull", "Secure stands"],
    productId: "prod-lift",
    active: true,
  },
];

function wetBerth(id: string, name: string, pier: string, lengthM: number, beamM: number): Berth {
  return {
    id,
    name,
    pier,
    kind: "wet",
    lengthM,
    beamM,
    hasPower: true,
    underCover: false,
    blocksTravelLift: false,
    priceClassName: "Standard",
  };
}

function dockyardBerth(id: string, name: string, lengthM: number, blocksTravelLift = false): Berth {
  return {
    id,
    name,
    pier: "Dockyard",
    kind: "boatyard",
    lengthM,
    beamM: 5,
    maxWeightT: 25,
    hasPower: true,
    underCover: false,
    blocksTravelLift,
    priceClassName: "Yard",
  };
}

function dryBerth(id: string, name: string): Berth {
  return {
    id,
    name,
    pier: "Dry",
    kind: "dry_storage",
    lengthM: 10,
    beamM: 3.4,
    hasPower: false,
    underCover: true,
    blocksTravelLift: false,
    priceClassName: "Dry",
  };
}

const BERTHS: Berth[] = [
  wetBerth("berth-a12", "A12", "A", 14, 4.5),
  wetBerth("berth-a14", "A14", "A", 12, 4),
  wetBerth("berth-b3", "B3", "B", 16, 5),
  dockyardBerth("berth-h1", "H1", 14),
  dockyardBerth("berth-h2", "H2", 16),
  dockyardBerth("berth-h3", "H3", 14),
  dockyardBerth("berth-h4", "H4", 15, true),
  dockyardBerth("berth-h5", "H5", 12),
  dockyardBerth("berth-h6", "H6", 18),
  dockyardBerth("berth-h7", "H7", 14),
  dockyardBerth("berth-h8", "H8", 12),
  dryBerth("berth-ds1", "DS1"),
  dryBerth("berth-ds2", "DS2"),
  dryBerth("berth-ds3", "DS3"),
  dryBerth("berth-ds4", "DS4"),
  dryBerth("berth-ds5", "DS5"),
  dryBerth("berth-ds6", "DS6"),
];

function customer(
  id: string,
  name: string,
  email: string,
  phone: string,
  accountOverdue = false
): Customer {
  return { id, name, email, phone, accountOverdue };
}

const CUSTOMERS: Customer[] = [
  customer("cust-hale", "James Hale", "james.hale@harbour.demo", "+61 412 100 001"),
  customer("cust-voss", "Elena Voss", "elena.voss@harbour.demo", "+61 412 100 002"),
  customer("cust-bridger", "Tom Bridger", "tom.bridger@harbour.demo", "+61 412 100 003"),
  customer("cust-shah", "Priya Shah", "priya.shah@harbour.demo", "+61 412 100 004"),
  customer("cust-chen", "Mark Chen", "mark.chen@harbour.demo", "+61 412 100 005", true),
  customer("cust-quinn", "Sarah Quinn", "sarah.quinn@harbour.demo", "+61 412 100 006"),
  customer("cust-ortiz", "Liam Ortiz", "liam.ortiz@harbour.demo", "+61 412 100 007"),
  customer("cust-blake", "Nora Blake", "nora.blake@harbour.demo", "+61 412 100 008"),
  customer("cust-reed", "Owen Reed", "owen.reed@harbour.demo", "+61 412 100 009"),
  customer("cust-kim", "Ava Kim", "ava.kim@harbour.demo", "+61 412 100 010"),
  customer("cust-cole", "Ben Cole", "ben.cole@harbour.demo", "+61 412 100 011"),
  customer("cust-frost", "Dana Frost", "dana.frost@harbour.demo", "+61 412 100 012"),
];

function vessel(
  id: string,
  name: string,
  customerId: string,
  lengthM: number,
  beamM: number,
  weightT: number,
  storageStatus: Vessel["storageStatus"],
  insuranceExpiry: string
): Vessel {
  return { id, name, customerId, lengthM, beamM, weightT, storageStatus, insuranceExpiry };
}

const VESSELS: Vessel[] = [
  vessel("ves-mako", "Mako", "cust-hale", 12.2, 3.8, 8, "stored", "2027-03-01"),
  vessel("ves-sea-sprite", "Sea Sprite", "cust-voss", 11.5, 3.6, 7, "stored", "2027-01-15"),
  vessel("ves-riviera", "Riviera", "cust-bridger", 13, 4, 10, "stored", "2026-12-01"),
  vessel("ves-pelican", "Pelican", "cust-shah", 8.5, 2.8, 3, "stored", "2027-06-01"),
  vessel("ves-tern", "Tern", "cust-chen", 7.8, 2.6, 2.5, "stored", "2027-02-01"),
  vessel("ves-heron", "Heron", "cust-quinn", 9, 2.9, 3.2, "stored", "2026-07-01"),
  vessel("ves-kingfisher", "Kingfisher", "cust-ortiz", 8.2, 2.7, 2.8, "stored", "2027-04-01"),
  vessel("ves-osprey", "Osprey", "cust-blake", 9.4, 3.1, 3.6, "launched", "2027-05-01"),
  vessel("ves-curlew", "Curlew", "cust-reed", 7.5, 2.5, 2.2, "stored", "2027-08-01"),
  vessel("ves-shearwater", "Shearwater", "cust-kim", 8.8, 2.9, 3, "stored", "2027-09-01"),
  vessel("ves-gannet", "Gannet", "cust-cole", 8, 2.7, 2.6, "stored", "2027-10-01"),
  vessel("ves-corsair", "Corsair", "cust-frost", 15, 4.6, 12, "stored", "2027-01-01"),
];

function jobFromType(typeId: string, extras: Partial<Job> = {}): Job {
  const jobType = JOB_TYPES.find((t) => t.id === typeId);
  if (!jobType) throw new Error(`Unknown job type ${typeId}`);
  return {
    typeId,
    location: "dockyard",
    workBy: "marina",
    tcStatus: "not_sent",
    checklist: itemsFromLabels(jobType.checklist),
    photos: photosFromLabels(jobType.photoChecklist),
    hours: [],
    materials: [],
    status: "open",
    ...extras,
  };
}

const RESERVATIONS: Reservation[] = [
  {
    id: "res-a12-mako",
    status: "approved",
    berthId: "berth-a12",
    customerId: "cust-hale",
    vesselId: "ves-mako",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
  },
  {
    id: "res-b3-corsair",
    status: "approved",
    berthId: "berth-b3",
    customerId: "cust-frost",
    vesselId: "ves-corsair",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    job: jobFromType("jt-engine", { location: "afloat" }),
  },
  {
    id: "res-h4-sea-sprite",
    status: "approved",
    berthId: "berth-h4",
    customerId: "cust-voss",
    vesselId: "ves-sea-sprite",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    job: jobFromType("jt-antifoul", {
      liftTime: "08:15",
      launchTime: "14:00",
      launchDate: "2026-08-14",
      workBy: "marina",
    }),
  },
  {
    id: "res-h2-riviera",
    status: "approved",
    berthId: "berth-h3",
    customerId: "cust-bridger",
    vesselId: "ves-riviera",
    startDate: "2026-08-11",
    endDate: "2026-08-13",
    job: jobFromType("jt-diy", {
      workBy: "diy",
      tcStatus: "sent",
    }),
  },
  {
    id: "res-h1-travel-lift",
    status: "approved",
    berthId: "berth-h1",
    customerId: "cust-ortiz",
    vesselId: "ves-kingfisher",
    startDate: "2026-08-12",
    endDate: "2026-08-13",
    job: jobFromType("jt-travel-lift", {
      liftTime: "09:00",
      launchTime: "16:00",
      launchDate: "2026-08-13",
      workBy: "contractor",
      contractorName: "Marine Works",
      tcStatus: "sent",
    }),
  },
  {
    id: "res-ds1-pelican",
    status: "approved",
    berthId: "berth-ds1",
    customerId: "cust-shah",
    vesselId: "ves-pelican",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-ds2-tern",
    status: "approved",
    berthId: "berth-ds2",
    customerId: "cust-chen",
    vesselId: "ves-tern",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-ds3-heron",
    status: "approved",
    berthId: "berth-ds3",
    customerId: "cust-quinn",
    vesselId: "ves-heron",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-ds4-kingfisher",
    status: "approved",
    berthId: "berth-ds4",
    customerId: "cust-ortiz",
    vesselId: "ves-kingfisher",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-ds5-osprey",
    status: "approved",
    berthId: "berth-ds5",
    customerId: "cust-blake",
    vesselId: "ves-osprey",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-ds6-curlew",
    status: "approved",
    berthId: "berth-ds6",
    customerId: "cust-reed",
    vesselId: "ves-curlew",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    id: "res-a14-shearwater",
    status: "to_be_approved",
    berthId: "berth-a14",
    customerId: "cust-kim",
    vesselId: "ves-shearwater",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
  },
];

const SATURDAY = DEMO_SATURDAY;
const FRIDAY = DEMO_FRIDAY;

const LAUNCH_FLEET: { customerId: string; vesselId: string; berthId: string }[] = [
  { customerId: "cust-shah", vesselId: "ves-pelican", berthId: "berth-ds1" },
  { customerId: "cust-chen", vesselId: "ves-tern", berthId: "berth-ds2" },
  { customerId: "cust-quinn", vesselId: "ves-heron", berthId: "berth-ds3" },
  { customerId: "cust-ortiz", vesselId: "ves-kingfisher", berthId: "berth-ds4" },
  { customerId: "cust-blake", vesselId: "ves-osprey", berthId: "berth-ds5" },
  { customerId: "cust-reed", vesselId: "ves-curlew", berthId: "berth-ds6" },
  { customerId: "cust-kim", vesselId: "ves-shearwater", berthId: "berth-ds1" },
  { customerId: "cust-cole", vesselId: "ves-gannet", berthId: "berth-ds2" },
];

function padTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function makeLaunchTask(
  id: string,
  taskType: TaskType,
  client: { customerId: string; vesselId: string; berthId: string },
  time: string,
  extras: Partial<LaunchTask> = {}
): LaunchTask {
  return {
    id,
    taskTypeId: taskType.id,
    customerId: client.customerId,
    vesselId: client.vesselId,
    berthId: client.berthId,
    date: SATURDAY,
    time,
    checklist: itemsFromLabels(taskType.checklist),
    status: "open",
    source: "staff",
    ...extras,
  };
}

function buildSaturdayTasks(): LaunchTask[] {
  const launchType = TASK_TYPES.find((t) => t.kind === "launch");
  const retrievalType = TASK_TYPES.find((t) => t.kind === "retrieval");
  if (!launchType || !retrievalType) throw new Error("Launch and Lift task types are required");

  const pelican = LAUNCH_FLEET[0];
  const osprey = LAUNCH_FLEET[4];
  const tasks: LaunchTask[] = [
    makeLaunchTask("lt-01", launchType, pelican, "09:00"),
    makeLaunchTask("lt-02", retrievalType, pelican, "15:00"),
  ];

  const reserved = new Set(["ves-pelican|tt-launch|09:00", "ves-pelican|tt-retrieval|15:00"]);
  let slot = 0;
  let serial = 3;

  while (tasks.length < 50) {
    const client = LAUNCH_FLEET[slot % LAUNCH_FLEET.length];
    const minutesFromStart = (slot * 15) % (9 * 60 + 15);
    const hours = 7 + Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    const time = padTime(hours, minutes);
    const taskType = slot % 2 === 0 ? launchType : retrievalType;
    const key = `${client.vesselId}|${taskType.id}|${time}`;
    slot += 1;
    if (client.vesselId === pelican.vesselId || client.vesselId === osprey.vesselId) continue;
    if (reserved.has(key)) continue;
    reserved.add(key);
    tasks.push(makeLaunchTask(`lt-${String(serial).padStart(2, "0")}`, taskType, client, time));
    serial += 1;
  }

  // Busy Friday customer requests (Western Port). Pelican is left off so the
  // portal round-trip can place her request live. Osprey is in the water, arriving
  // for storage — her Lift is the “onto the rack” demo.
  const fridayRequests: LaunchTask[] = [
    makeLaunchTask("lt-in-osprey", retrievalType, osprey, "08:00", {
      date: FRIDAY,
      status: "open",
      source: "staff",
    }),
    makeLaunchTask("lt-req-02", launchType, LAUNCH_FLEET[2], "08:30", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
    makeLaunchTask("lt-req-04", launchType, LAUNCH_FLEET[5], "09:30", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
    makeLaunchTask("lt-req-05", launchType, LAUNCH_FLEET[1], "10:00", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
  ];

  return [...fridayRequests, ...tasks];
}

const PORTAL_LINKS: PortalLink[] = [
  {
    id: "plink-pelican",
    token: "demo-pelican-portal",
    customerId: "cust-shah",
    createdAt: "2026-08-10T09:00:00.000Z",
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
  {
    id: "plink-tern",
    token: "demo-tern-portal",
    customerId: "cust-chen",
    createdAt: "2026-08-10T09:00:00.000Z",
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
  {
    id: "plink-heron",
    token: "demo-heron-portal",
    customerId: "cust-quinn",
    createdAt: "2026-08-10T09:00:00.000Z",
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
];

const ACTIVITY: ActivityEvent[] = [
  {
    id: "act-2",
    at: "2026-08-12T10:00:00.000Z",
    actor: "office",
    message: "T&Cs sent to customer",
    reservationId: "res-h1-travel-lift",
    vesselId: "ves-kingfisher",
    customerId: "cust-ortiz",
  },
];

const MESSAGES: Message[] = [
  {
    id: "msg-2",
    at: "2026-08-12T10:00:00.000Z",
    customerId: "cust-ortiz",
    channel: "email",
    template: "tc_sent",
    subject: "Please sign yard T&Cs",
    body: "Please open your status link and sign the yard terms before we can lift your boat.",
    read: false,
  },
];

export function createSeedState(): MarinaState {
  return {
    settings: SETTINGS,
    role: "office",
    berths: BERTHS,
    products: PRODUCTS,
    jobTypes: JOB_TYPES,
    taskTypes: TASK_TYPES,
    customers: CUSTOMERS,
    vessels: VESSELS,
    reservations: RESERVATIONS,
    launchTasks: buildSaturdayTasks(),
    invoices: [],
    portalLinks: PORTAL_LINKS,
    changeRequests: [],
    activity: ACTIVITY,
    messages: MESSAGES,
    selectedReservationId: null,
    selectedDate: FRIDAY,
  };
}
