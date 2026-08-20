import type {
  Berth,
  Customer,
  Job,
  JobType,
  LaunchTask,
  MarinaState,
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
};

const PRODUCTS: Product[] = [
  { id: "prod-wet-night", name: "Berth night", unitType: "DAY", unitPrice: 85, bankAccount: "Marina", active: true },
  { id: "prod-dockyard-fee", name: "Dockyard fee", unitType: "DAY", unitPrice: 120, bankAccount: "Holding", active: true },
  { id: "prod-labour-hour", name: "Labour hour", unitType: "HOUR", unitPrice: 95, bankAccount: "Holding", active: true },
  { id: "prod-disc-anode", name: "Disc anode", unitType: "UNIT", unitPrice: 45, bankAccount: "Holding", active: true },
  { id: "prod-travel-lift", name: "Travel lift", unitType: "UNIT", unitPrice: 350, bankAccount: "Holding", active: true },
  { id: "prod-boat-wash", name: "Boat wash", unitType: "UNIT", unitPrice: 80, bankAccount: "Holding", active: true },
];

const JOB_TYPES: JobType[] = [
  {
    id: "jt-antifoul",
    name: "Antifoul",
    colour: "#f59e0b",
    defaultDurationDays: 5,
    checklist: ["Wash hull", "Mask fittings", "Apply antifoul"],
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
    active: true,
  },
  {
    id: "tt-retrieval",
    name: "Lift",
    kind: "retrieval",
    checklist: ["Rinse hull", "Secure stands"],
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

const CUSTOMERS: Customer[] = [
  { id: "cust-hale", name: "James Hale" },
  { id: "cust-voss", name: "Elena Voss" },
  { id: "cust-bridger", name: "Tom Bridger" },
  { id: "cust-shah", name: "Priya Shah" },
  { id: "cust-chen", name: "Mark Chen" },
  { id: "cust-quinn", name: "Sarah Quinn" },
  { id: "cust-ortiz", name: "Liam Ortiz" },
  { id: "cust-blake", name: "Nora Blake" },
  { id: "cust-reed", name: "Owen Reed" },
  { id: "cust-kim", name: "Ava Kim" },
  { id: "cust-cole", name: "Ben Cole" },
  { id: "cust-frost", name: "Dana Frost" },
];

const VESSELS: Vessel[] = [
  { id: "ves-mako", name: "Mako", customerId: "cust-hale", lengthM: 12.2, beamM: 3.8, weightT: 8, storageStatus: "stored" },
  { id: "ves-sea-sprite", name: "Sea Sprite", customerId: "cust-voss", lengthM: 11.5, beamM: 3.6, weightT: 7, storageStatus: "stored" },
  { id: "ves-riviera", name: "Riviera", customerId: "cust-bridger", lengthM: 13, beamM: 4, weightT: 10, storageStatus: "stored" },
  { id: "ves-pelican", name: "Pelican", customerId: "cust-shah", lengthM: 8.5, beamM: 2.8, weightT: 3, storageStatus: "stored" },
  { id: "ves-tern", name: "Tern", customerId: "cust-chen", lengthM: 7.8, beamM: 2.6, weightT: 2.5, storageStatus: "launched" },
  { id: "ves-heron", name: "Heron", customerId: "cust-quinn", lengthM: 9, beamM: 2.9, weightT: 3.2, storageStatus: "stored" },
  { id: "ves-kingfisher", name: "Kingfisher", customerId: "cust-ortiz", lengthM: 8.2, beamM: 2.7, weightT: 2.8, storageStatus: "stored" },
  { id: "ves-osprey", name: "Osprey", customerId: "cust-blake", lengthM: 9.4, beamM: 3.1, weightT: 3.6, storageStatus: "stored" },
  { id: "ves-curlew", name: "Curlew", customerId: "cust-reed", lengthM: 7.5, beamM: 2.5, weightT: 2.2, storageStatus: "stored" },
  { id: "ves-shearwater", name: "Shearwater", customerId: "cust-kim", lengthM: 8.8, beamM: 2.9, weightT: 3, storageStatus: "stored" },
  { id: "ves-gannet", name: "Gannet", customerId: "cust-cole", lengthM: 8, beamM: 2.7, weightT: 2.6, storageStatus: "stored" },
  { id: "ves-corsair", name: "Corsair", customerId: "cust-frost", lengthM: 15, beamM: 4.6, weightT: 12, storageStatus: "stored" },
];

function checklistFrom(labels: string[]): { label: string; done: boolean }[] {
  return labels.map((label) => ({ label, done: false }));
}

function jobFromType(typeId: string, extras: Partial<Job> = {}): Job {
  const jobType = JOB_TYPES.find((t) => t.id === typeId);
  if (!jobType) throw new Error(`Unknown job type ${typeId}`);
  return {
    typeId,
    location: "dockyard",
    tcStatus: "not_sent",
    checklist: checklistFrom(jobType.checklist),
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
    job: jobFromType("jt-antifoul", { liftTime: "08:15", launchTime: "14:00" }),
  },
  {
    id: "res-h2-riviera",
    status: "approved",
    berthId: "berth-h3",
    customerId: "cust-bridger",
    vesselId: "ves-riviera",
    startDate: "2026-08-11",
    endDate: "2026-08-13",
    job: jobFromType("jt-diy"),
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

const SATURDAY = "2026-08-15";

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
  time: string
): LaunchTask {
  return {
    id,
    taskTypeId: taskType.id,
    customerId: client.customerId,
    vesselId: client.vesselId,
    berthId: client.berthId,
    date: SATURDAY,
    time,
    checklist: checklistFrom(taskType.checklist),
    status: "open",
  };
}

function buildSaturdayTasks(): LaunchTask[] {
  const launchType = TASK_TYPES.find((t) => t.kind === "launch");
  const retrievalType = TASK_TYPES.find((t) => t.kind === "retrieval");
  if (!launchType || !retrievalType) throw new Error("Launch and Lift task types are required");

  const pelican = LAUNCH_FLEET[0];
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
    if (reserved.has(key)) continue;
    reserved.add(key);
    tasks.push(makeLaunchTask(`lt-${String(serial).padStart(2, "0")}`, taskType, client, time));
    serial += 1;
  }

  return tasks;
}

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
    selectedReservationId: null,
    selectedDate: SATURDAY,
  };
}
