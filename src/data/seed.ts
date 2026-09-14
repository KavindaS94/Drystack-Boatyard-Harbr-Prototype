import { DEMO_MONTH_END, DEMO_MONTH_START, DEMO_SATURDAY, DEMO_TODAY, DEMO_WEEK_END, DEMO_WEEK_START } from "../lib/demo-dates";
import { addDays } from "../lib/iso-date";
import { itemsFromOptions, photosFromOptions } from "../lib/checklist";
import type {
  ActivityEvent,
  Berth,
  Customer,
  Equipment,
  EquipmentBooking,
  Job,
  JobType,
  LaunchTask,
  MarinaState,
  Message,
  Product,
  Reservation,
  Settings,
  TaskModule,
  TaskType,
  Vessel,
} from "../types/domain";

const SETTINGS: Settings = {
  boatyardEnabled: true,
  dryStorageEnabled: true,
  hardstandEnabled: true,
  boatyardLabel: "Dockyard",
  dryStorageLabel: "Dry stack",
  hardstandLabel: "Hardstand",
  jobPanelTitle: "Job",
  hidePricesForYard: true,
  autoDnlOverdue: true,
  autoDnlInsurance: true,
  checklistCategories: ["Yard job", "QA photo", "Launch", "Lift", "Safety", "Prep"],
};

const EQUIPMENT: Equipment[] = [
  {
    id: "eq-travel-lift",
    name: "Travel lift",
    kind: "travel_lift",
    active: true,
    dayStart: "07:00",
    dayEnd: "17:00",
    slotMinutes: 60,
  },
  {
    id: "eq-fork-lift",
    name: "Fork lift",
    kind: "fork_lift",
    active: true,
    dayStart: "07:00",
    dayEnd: "17:00",
    slotMinutes: 30,
  },
];

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

const QA_PHOTOS = [
  { label: "Lift-out photo taken", category: "QA photo" },
  { label: "Relaunch photo taken", category: "QA photo" },
];

const JOB_TYPES: JobType[] = [
  {
    id: "jt-antifoul",
    name: "Antifoul",
    colour: "#f59e0b",
    defaultDurationDays: 5,
    checklist: [
      { label: "Wash hull", category: "Yard job" },
      { label: "Mask fittings", category: "Yard job" },
      { label: "Apply antifoul", category: "Yard job" },
    ],
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
    checklist: [
      { label: "Site induction", category: "Safety" },
      { label: "Stands in place", category: "Prep" },
    ],
    photoChecklist: [...QA_PHOTOS],
    productIds: ["prod-labour-hour", "prod-dockyard-fee"],
    requiresTc: false,
    active: true,
  },
  {
    id: "jt-engine",
    name: "Engine service",
    colour: "#0ea5e9",
    defaultDurationDays: 2,
    checklist: [
      { label: "Isolate batteries", category: "Safety" },
      { label: "Drain coolant", category: "Yard job" },
      { label: "Service log", category: "Yard job" },
    ],
    photoChecklist: [...QA_PHOTOS],
    productIds: ["prod-labour-hour", "prod-dockyard-fee"],
    requiresTc: true,
    active: true,
  },
];

function launchLiftTypes(module: TaskModule, prefix: string): TaskType[] {
  return [
    {
      id: `${prefix}-launch`,
      name: "Launch",
      kind: "launch",
      module,
      checklist: [
        { label: "Check straps", category: "Launch" },
        { label: "Engine ok", category: "Launch" },
      ],
      productId: "prod-launch",
      active: true,
    },
    {
      id: `${prefix}-lift`,
      name: "Lift",
      kind: "retrieval",
      module,
      checklist: [
        { label: "Rinse hull", category: "Lift" },
        { label: "Secure stands", category: "Lift" },
      ],
      productId: "prod-lift",
      active: true,
    },
  ];
}

const TASK_TYPES: TaskType[] = [
  ...launchLiftTypes("dry_storage", "tt-ds"),
  ...launchLiftTypes("hardstand", "tt-hs"),
  ...launchLiftTypes("boatyard", "tt-by"),
  {
    id: "tt-other",
    name: "Wash",
    kind: "other",
    module: "other",
    checklist: [{ label: "Rinse and dry", category: "Prep" }],
    productId: "prod-boat-wash",
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

function hardstandBerth(id: string, name: string): Berth {
  return {
    id,
    name,
    pier: "Hardstand",
    kind: "hardstand",
    lengthM: 12,
    beamM: 4,
    maxWeightT: 12,
    hasPower: true,
    underCover: false,
    blocksTravelLift: false,
    priceClassName: "Hardstand",
  };
}

const BERTHS: Berth[] = [
  wetBerth("berth-a08", "A08", "A", 12, 4),
  wetBerth("berth-a10", "A10", "A", 12, 4),
  wetBerth("berth-a12", "A12", "A", 14, 4.5),
  wetBerth("berth-a14", "A14", "A", 12, 4),
  wetBerth("berth-a16", "A16", "A", 14, 4.5),
  wetBerth("berth-a18", "A18", "A", 12, 4),
  wetBerth("berth-b1", "B1", "B", 14, 4.5),
  wetBerth("berth-b3", "B3", "B", 16, 5),
  wetBerth("berth-b5", "B5", "B", 12, 4),
  wetBerth("berth-b7", "B7", "B", 14, 4.5),
  wetBerth("berth-b9", "B9", "B", 16, 5),
  wetBerth("berth-c2", "C2", "C", 12, 4),
  wetBerth("berth-c4", "C4", "C", 14, 4.5),
  wetBerth("berth-c6", "C6", "C", 12, 4),
  wetBerth("berth-c8", "C8", "C", 12, 4),
  wetBerth("berth-c10", "C10", "C", 14, 4.5),
  dockyardBerth("berth-h1", "H1", 14),
  dockyardBerth("berth-h2", "H2", 16),
  dockyardBerth("berth-h3", "H3", 14),
  dockyardBerth("berth-h4", "H4", 15, true),
  dockyardBerth("berth-h5", "H5", 14),
  dockyardBerth("berth-h6", "H6", 18),
  dockyardBerth("berth-h7", "H7", 14),
  dockyardBerth("berth-h8", "H8", 12),
  dryBerth("berth-ds1", "DS1"),
  dryBerth("berth-ds2", "DS2"),
  dryBerth("berth-ds3", "DS3"),
  dryBerth("berth-ds4", "DS4"),
  dryBerth("berth-ds5", "DS5"),
  dryBerth("berth-ds6", "DS6"),
  dryBerth("berth-ds7", "DS7"),
  hardstandBerth("berth-hs1", "HS1"),
  hardstandBerth("berth-hs2", "HS2"),
  hardstandBerth("berth-hs3", "HS3"),
  hardstandBerth("berth-hs4", "HS4"),
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
  customer("cust-nguyen", "Maya Nguyen", "maya.nguyen@harbour.demo", "+61 412 100 013"),
  customer("cust-ross", "Ivy Ross", "ivy.ross@harbour.demo", "+61 412 100 014"),
  customer("cust-patel", "Arun Patel", "arun.patel@harbour.demo", "+61 412 100 015"),
  customer("cust-moore", "Chloe Moore", "chloe.moore@harbour.demo", "+61 412 100 016"),
  customer("cust-diaz", "Felix Diaz", "felix.diaz@harbour.demo", "+61 412 100 017"),
  customer("cust-owens", "Ruth Owens", "ruth.owens@harbour.demo", "+61 412 100 018"),
  customer("cust-singh", "Dev Singh", "dev.singh@harbour.demo", "+61 412 100 019"),
  customer("cust-hart", "Lena Hart", "lena.hart@harbour.demo", "+61 412 100 020"),
  customer("cust-brooks", "Sam Brooks", "sam.brooks@harbour.demo", "+61 412 100 021"),
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
  vessel("ves-heron", "Heron", "cust-quinn", 9, 2.9, 3.2, "stored", addDays(DEMO_TODAY, -45)),
  vessel("ves-kingfisher", "Kingfisher", "cust-ortiz", 8.2, 2.7, 2.8, "stored", "2027-04-01"),
  vessel("ves-osprey", "Osprey", "cust-blake", 9.4, 3.1, 3.6, "stored", "2027-05-01"),
  vessel("ves-curlew", "Curlew", "cust-reed", 7.5, 2.5, 2.2, "stored", "2027-08-01"),
  vessel("ves-shearwater", "Shearwater", "cust-kim", 8.8, 2.9, 3, "stored", "2027-09-01"),
  vessel("ves-gannet", "Gannet", "cust-cole", 8, 2.7, 2.6, "stored", "2027-10-01"),
  vessel("ves-corsair", "Corsair", "cust-frost", 15, 4.6, 12, "stored", "2027-01-01"),
  vessel("ves-kestrel", "Kestrel", "cust-nguyen", 9.2, 3, 3.4, "stored", "2027-07-01"),
  vessel("ves-albatross", "Albatross", "cust-ross", 11.8, 3.7, 7.2, "stored", "2027-04-15"),
  vessel("ves-petrel", "Petrel", "cust-patel", 10.5, 3.4, 5.1, "stored", "2027-11-01"),
  vessel("ves-sanderling", "Sanderling", "cust-moore", 8.6, 2.8, 2.9, "stored", "2027-06-12"),
  vessel("ves-teal", "Teal", "cust-diaz", 13.2, 4.1, 9.4, "stored", "2027-02-20"),
  vessel("ves-plover", "Plover", "cust-owens", 8.1, 2.7, 2.6, "stored", "2027-08-08"),
  vessel("ves-whimbrel", "Whimbrel", "cust-singh", 11, 3.5, 6.4, "stored", "2027-03-22"),
  vessel("ves-godwit", "Godwit", "cust-hart", 9, 3, 3.3, "stored", "2027-09-18"),
  vessel("ves-dunlin", "Dunlin", "cust-brooks", 10.2, 3.3, 4.8, "stored", "2027-05-30"),
];

function jobFromType(typeId: string, extras: Partial<Job> = {}): Job {
  const jobType = JOB_TYPES.find((t) => t.id === typeId);
  if (!jobType) throw new Error(`Unknown job type ${typeId}`);
  return {
    typeId,
    location: "dockyard",
    workBy: "marina",
    tcStatus: "not_sent",
    checklist: itemsFromOptions(jobType.checklist),
    photos: photosFromOptions(jobType.photoChecklist),
    hours: [],
    materials: [],
    status: "open",
    ...extras,
  };
}

const WEEK_MON = DEMO_WEEK_START;
const WEEK_TUE = addDays(WEEK_MON, 1);
const WEEK_WED = addDays(WEEK_MON, 2);
const MONTH_START = DEMO_MONTH_START;
const MONTH_END = DEMO_MONTH_END;

const RESERVATIONS: Reservation[] = [
  {
    id: "res-a12-mako",
    status: "approved",
    berthId: "berth-a12",
    customerId: "cust-hale",
    vesselId: "ves-mako",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-b3-corsair",
    status: "approved",
    berthId: "berth-b3",
    customerId: "cust-frost",
    vesselId: "ves-corsair",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-h4-sea-sprite",
    status: "approved",
    berthId: "berth-h4",
    customerId: "cust-voss",
    vesselId: "ves-sea-sprite",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
    job: jobFromType("jt-antifoul", {
      liftTime: "08:00",
      launchTime: "14:00",
      launchDate: DEMO_TODAY,
      workBy: "marina",
    }),
  },
  {
    id: "res-h2-riviera",
    status: "approved",
    berthId: "berth-h2",
    customerId: "cust-bridger",
    vesselId: "ves-riviera",
    startDate: WEEK_TUE,
    endDate: DEMO_WEEK_END,
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
    startDate: WEEK_WED,
    endDate: DEMO_WEEK_END,
    job: jobFromType("jt-engine", {
      liftTime: "09:00",
      launchTime: "16:00",
      launchDate: DEMO_TODAY,
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
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-ds2-tern",
    status: "approved",
    berthId: "berth-ds2",
    customerId: "cust-chen",
    vesselId: "ves-tern",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-ds3-heron",
    status: "approved",
    berthId: "berth-ds3",
    customerId: "cust-quinn",
    vesselId: "ves-heron",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-ds4-kingfisher",
    status: "approved",
    berthId: "berth-ds4",
    customerId: "cust-ortiz",
    vesselId: "ves-kingfisher",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-a10-osprey",
    status: "approved",
    berthId: "berth-a10",
    customerId: "cust-blake",
    vesselId: "ves-osprey",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-ds6-curlew",
    status: "approved",
    berthId: "berth-ds6",
    customerId: "cust-reed",
    vesselId: "ves-curlew",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-hs1-gannet",
    status: "approved",
    berthId: "berth-hs1",
    customerId: "cust-cole",
    vesselId: "ves-gannet",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-a14-shearwater",
    status: "to_be_approved",
    berthId: "berth-a14",
    customerId: "cust-kim",
    vesselId: "ves-shearwater",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-a08-kestrel",
    status: "approved",
    berthId: "berth-a08",
    customerId: "cust-nguyen",
    vesselId: "ves-kestrel",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-a16-albatross",
    status: "approved",
    berthId: "berth-a16",
    customerId: "cust-ross",
    vesselId: "ves-albatross",
    startDate: WEEK_TUE,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-b1-petrel",
    status: "approved",
    berthId: "berth-b1",
    customerId: "cust-patel",
    vesselId: "ves-petrel",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-b5-sanderling",
    status: "approved",
    berthId: "berth-b5",
    customerId: "cust-moore",
    vesselId: "ves-sanderling",
    startDate: DEMO_TODAY,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-b9-teal",
    status: "approved",
    berthId: "berth-b9",
    customerId: "cust-diaz",
    vesselId: "ves-teal",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-c2-plover",
    status: "approved",
    berthId: "berth-c2",
    customerId: "cust-owens",
    vesselId: "ves-plover",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-c4-whimbrel",
    status: "approved",
    berthId: "berth-c4",
    customerId: "cust-singh",
    vesselId: "ves-whimbrel",
    startDate: WEEK_WED,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-c8-godwit",
    status: "pending",
    berthId: "berth-c8",
    customerId: "cust-hart",
    vesselId: "ves-godwit",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
  {
    id: "res-c10-dunlin",
    status: "approved",
    berthId: "berth-c10",
    customerId: "cust-brooks",
    vesselId: "ves-dunlin",
    startDate: WEEK_MON,
    endDate: DEMO_WEEK_END,
  },
];

const SATURDAY = DEMO_SATURDAY;
const FRIDAY = DEMO_TODAY;

const LAUNCH_FLEET: { customerId: string; vesselId: string; berthId: string }[] = [
  { customerId: "cust-shah", vesselId: "ves-pelican", berthId: "berth-ds1" },
  { customerId: "cust-chen", vesselId: "ves-tern", berthId: "berth-ds2" },
  { customerId: "cust-quinn", vesselId: "ves-heron", berthId: "berth-ds3" },
  { customerId: "cust-ortiz", vesselId: "ves-kingfisher", berthId: "berth-ds4" },
  { customerId: "cust-blake", vesselId: "ves-osprey", berthId: "berth-a10" },
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
    module: taskType.module,
    checklist: itemsFromOptions(taskType.checklist),
    status: "open",
    source: "staff",
    ...extras,
  };
}

function buildSaturdayTasks(): LaunchTask[] {
  const launchType = TASK_TYPES.find((t) => t.id === "tt-ds-launch");
  const retrievalType = TASK_TYPES.find((t) => t.id === "tt-ds-lift");
  const hsLaunch = TASK_TYPES.find((t) => t.id === "tt-hs-launch");
  const byLift = TASK_TYPES.find((t) => t.id === "tt-by-lift");
  const byLaunch = TASK_TYPES.find((t) => t.id === "tt-by-launch");
  const otherType = TASK_TYPES.find((t) => t.id === "tt-other");
  if (!launchType || !retrievalType || !hsLaunch || !byLift || !byLaunch || !otherType) {
    throw new Error("Launch and Lift task types are required");
  }

  const pelican = LAUNCH_FLEET[0];
  const tasks: LaunchTask[] = [
    makeLaunchTask("lt-01", launchType, pelican, "09:00"),
    makeLaunchTask("lt-02", retrievalType, pelican, "15:00"),
  ];

  // One fork-lift vessel per 30-minute slot. Mix remaining dry-stack boats
  // into unique Saturday times so the busy-day board still looks full.
  const others = LAUNCH_FLEET.filter(
    (client) => client.vesselId !== "ves-pelican" && client.vesselId !== "ves-osprey"
  );
  let serial = 3;
  let slotIndex = 0;
  for (let hour = 7; hour < 17; hour += 1) {
    for (const minutes of [0, 30]) {
      const time = padTime(hour, minutes);
      if (time === "09:00" || time === "15:00") continue;
      const client = others[slotIndex % others.length];
      const taskType = slotIndex % 2 === 0 ? launchType : retrievalType;
      tasks.push(makeLaunchTask(`lt-${String(serial).padStart(2, "0")}`, taskType, client, time));
      serial += 1;
      slotIndex += 1;
    }
  }

  const fridayRequests: LaunchTask[] = [
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
    makeLaunchTask(
      "lt-hs-req",
      hsLaunch,
      { customerId: "cust-cole", vesselId: "ves-gannet", berthId: "berth-hs1" },
      "11:00",
      { date: FRIDAY, status: "requested", source: "customer" }
    ),
    makeLaunchTask(
      "lt-by-sea-sprite-lift",
      byLift,
      { customerId: "cust-voss", vesselId: "ves-sea-sprite", berthId: "berth-h4" },
      "08:00",
      {
        date: FRIDAY,
        status: "done",
        source: "staff",
        reservationId: "res-h4-sea-sprite",
        checklist: itemsFromOptions(byLift.checklist).map((item) => ({ ...item, done: true })),
      }
    ),
    makeLaunchTask(
      "lt-by-sea-sprite-launch",
      byLaunch,
      { customerId: "cust-voss", vesselId: "ves-sea-sprite", berthId: "berth-h4" },
      "14:00",
      { date: FRIDAY, status: "open", source: "staff", reservationId: "res-h4-sea-sprite" }
    ),
    makeLaunchTask(
      "lt-by-kingfisher-lift",
      byLift,
      { customerId: "cust-ortiz", vesselId: "ves-kingfisher", berthId: "berth-h1" },
      "09:00",
      {
        date: FRIDAY,
        status: "done",
        source: "staff",
        reservationId: "res-h1-travel-lift",
        checklist: itemsFromOptions(byLift.checklist).map((item) => ({ ...item, done: true })),
      }
    ),
    makeLaunchTask(
      "lt-by-kingfisher-launch",
      byLaunch,
      { customerId: "cust-ortiz", vesselId: "ves-kingfisher", berthId: "berth-h1" },
      "16:00",
      { date: FRIDAY, status: "open", source: "staff", reservationId: "res-h1-travel-lift" }
    ),
    makeLaunchTask("lt-other-wash", otherType, pelican, "13:00", { date: FRIDAY }),
  ];

  return [...fridayRequests, ...tasks];
}

function booking(
  id: string,
  equipmentId: string,
  date: string,
  startTime: string,
  taskId: string,
  vesselId: string
): EquipmentBooking {
  return { id, equipmentId, date, startTime, taskId, vesselId };
}

function buildEquipmentBookings(tasks: LaunchTask[]): EquipmentBooking[] {
  const bookings: EquipmentBooking[] = [];
  for (const task of tasks) {
    if (task.status === "declined") continue;
    const equipmentId =
      task.module === "boatyard" ? "eq-travel-lift" : task.module === "other" ? null : "eq-fork-lift";
    if (!equipmentId) continue;
    bookings.push(
      booking(`eb-${task.id}`, equipmentId, task.date, task.time, task.id, task.vesselId)
    );
  }
  return bookings;
}

const ACTIVITY: ActivityEvent[] = [
  {
    id: "act-2",
    at: `${WEEK_WED}T10:00:00.000Z`,
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
    at: `${WEEK_WED}T10:00:00.000Z`,
    customerId: "cust-ortiz",
    channel: "email",
    template: "tc_sent",
    subject: "Please sign yard T&Cs",
    body: "Please reply to this email to confirm you accept the yard terms before we lift your boat.",
    read: false,
  },
];

export function createSeedState(): MarinaState {
  const launchTasks = buildSaturdayTasks();
  return {
    settings: SETTINGS,
    role: "office",
    berths: BERTHS,
    products: PRODUCTS,
    jobTypes: JOB_TYPES,
    taskTypes: TASK_TYPES,
    equipment: EQUIPMENT,
    equipmentBookings: buildEquipmentBookings(launchTasks),
    customers: CUSTOMERS,
    vessels: VESSELS,
    reservations: RESERVATIONS,
    launchTasks,
    invoices: [],
    portalLinks: [],
    changeRequests: [],
    activity: ACTIVITY,
    messages: MESSAGES,
    selectedReservationId: null,
    selectedDate: FRIDAY,
  };
}
