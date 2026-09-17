import { DEMO_MONTH_END, DEMO_MONTH_START, DEMO_SATURDAY, DEMO_TODAY, DEMO_WEEK_END, DEMO_WEEK_START } from "../lib/demo-dates";
import { addDays } from "../lib/iso-date";
import { itemsFromOptions, photosFromOptions } from "../lib/checklist";
import type {
  ActivityEvent,
  Berth,
  ChecklistItem,
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
  boatyardLabel: "Dockyard",
  dryStorageLabel: "Dry stack",
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
    dayStart: "06:00",
    dayEnd: "18:00",
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
  vessel("ves-osprey", "Osprey", "cust-blake", 9.4, 3.1, 3.6, "launched", "2027-05-01"),
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

function ticked(kind: "lift" | "launch"): ChecklistItem[] {
  const taskType = TASK_TYPES.find((item) => item.id === `tt-by-${kind}`);
  return itemsFromOptions(taskType?.checklist ?? []).map((item) => ({ ...item, done: true }));
}

function jobItems(typeId: string, doneThrough: number): ChecklistItem[] {
  return itemsFromOptions(JOB_TYPES.find((item) => item.id === typeId)?.checklist ?? []).map((item, index) => ({
    ...item,
    done: index < doneThrough,
  }));
}

function jobPhotos(doneThrough: number): ReturnType<typeof photosFromOptions> {
  return photosFromOptions(QA_PHOTOS).map((photo, index) => ({
    ...photo,
    done: index < doneThrough,
  }));
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
    endDate: WEEK_MON,
    job: jobFromType("jt-antifoul", {
      liftTime: "08:00",
      launchTime: "14:00",
      launchDate: WEEK_MON,
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
    endDate: WEEK_TUE,
    job: jobFromType("jt-diy", {
      liftTime: "09:00",
      launchTime: "15:00",
      launchDate: WEEK_TUE,
      workBy: "diy",
      tcStatus: "sent",
      checklist: jobItems("jt-diy", 1),
    }),
  },
  {
    id: "res-h1-travel-lift",
    status: "approved",
    berthId: "berth-h1",
    customerId: "cust-ortiz",
    vesselId: "ves-kingfisher",
    startDate: WEEK_WED,
    endDate: WEEK_WED,
    job: jobFromType("jt-engine", {
      liftTime: "09:00",
      launchTime: "15:00",
      launchDate: WEEK_WED,
      workBy: "contractor",
      contractorName: "Marine Works",
      tcStatus: "sent",
      checklist: jobItems("jt-engine", 1),
    }),
  },
  {
    id: "res-h3-petrel",
    status: "approved",
    berthId: "berth-h3",
    customerId: "cust-patel",
    vesselId: "ves-petrel",
    startDate: DEMO_TODAY,
    endDate: DEMO_TODAY,
    job: jobFromType("jt-antifoul", {
      liftTime: "10:00",
      launchTime: "14:00",
      launchDate: DEMO_TODAY,
      workBy: "marina",
    }),
  },
  {
    id: "res-h6-teal",
    status: "approved",
    berthId: "berth-h6",
    customerId: "cust-diaz",
    vesselId: "ves-teal",
    startDate: DEMO_TODAY,
    endDate: DEMO_TODAY,
    job: jobFromType("jt-engine", {
      liftTime: "11:00",
      launchTime: "16:00",
      launchDate: DEMO_TODAY,
      workBy: "marina",
      tcStatus: "signed",
      tcSignedAt: `${WEEK_WED}T16:00:00.000Z`,
      checklist: jobItems("jt-engine", 2),
    }),
  },
  {
    id: "res-h7-plover",
    status: "approved",
    berthId: "berth-h7",
    customerId: "cust-owens",
    vesselId: "ves-plover",
    startDate: WEEK_WED,
    endDate: WEEK_WED,
    job: jobFromType("jt-diy", {
      liftTime: "10:00",
      launchTime: "16:00",
      launchDate: WEEK_WED,
      workBy: "diy",
      checklist: jobItems("jt-diy", 2),
      photos: jobPhotos(1),
    }),
  },
  {
    id: "res-h8-sanderling",
    status: "approved",
    berthId: "berth-h8",
    customerId: "cust-moore",
    vesselId: "ves-sanderling",
    startDate: WEEK_WED,
    endDate: WEEK_WED,
    job: jobFromType("jt-diy", {
      liftTime: "08:00",
      launchTime: "14:00",
      launchDate: WEEK_WED,
      workBy: "diy",
      status: "done",
      checklist: jobItems("jt-diy", 2),
      photos: jobPhotos(2),
      hours: [{ id: "line-h8-labour", productId: "prod-labour-hour", qty: 2, staffName: "Yard" }],
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
    id: "res-ds4-dunlin",
    status: "approved",
    berthId: "berth-ds4",
    customerId: "cust-brooks",
    vesselId: "ves-dunlin",
    startDate: MONTH_START,
    endDate: MONTH_END,
  },
  {
    id: "res-ds5-kestrel",
    status: "approved",
    berthId: "berth-ds5",
    customerId: "cust-nguyen",
    vesselId: "ves-kestrel",
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
    id: "res-a14-shearwater",
    status: "to_be_approved",
    berthId: "berth-a14",
    customerId: "cust-kim",
    vesselId: "ves-shearwater",
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
];

const SATURDAY = DEMO_SATURDAY;
const FRIDAY = DEMO_TODAY;

const LAUNCH_FLEET: { customerId: string; vesselId: string; berthId: string }[] = [
  { customerId: "cust-shah", vesselId: "ves-pelican", berthId: "berth-ds1" },
  { customerId: "cust-chen", vesselId: "ves-tern", berthId: "berth-ds2" },
  { customerId: "cust-quinn", vesselId: "ves-heron", berthId: "berth-ds3" },
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

function buildLaunchTasks(): LaunchTask[] {
  const dsLaunch = TASK_TYPES.find((t) => t.id === "tt-ds-launch");
  const dsLift = TASK_TYPES.find((t) => t.id === "tt-ds-lift");
  const byLift = TASK_TYPES.find((t) => t.id === "tt-by-lift");
  const byLaunch = TASK_TYPES.find((t) => t.id === "tt-by-launch");
  const otherType = TASK_TYPES.find((t) => t.id === "tt-other");
  if (!dsLaunch || !dsLift || !byLift || !byLaunch || !otherType) {
    throw new Error("Launch and Lift task types are required");
  }

  const seaSprite = { customerId: "cust-voss", vesselId: "ves-sea-sprite", berthId: "berth-h4" };
  const riviera = { customerId: "cust-bridger", vesselId: "ves-riviera", berthId: "berth-h2" };
  const kingfisher = { customerId: "cust-ortiz", vesselId: "ves-kingfisher", berthId: "berth-h1" };
  const petrel = { customerId: "cust-patel", vesselId: "ves-petrel", berthId: "berth-h3" };
  const teal = { customerId: "cust-diaz", vesselId: "ves-teal", berthId: "berth-h6" };
  const plover = { customerId: "cust-owens", vesselId: "ves-plover", berthId: "berth-h7" };
  const sanderling = { customerId: "cust-moore", vesselId: "ves-sanderling", berthId: "berth-h8" };
  const pelican = LAUNCH_FLEET[0];
  const kestrel = { customerId: "cust-nguyen", vesselId: "ves-kestrel", berthId: "berth-ds5" };
  const dunlin = { customerId: "cust-brooks", vesselId: "ves-dunlin", berthId: "berth-ds4" };
  const osprey = { customerId: "cust-blake", vesselId: "ves-osprey", berthId: "berth-a10" };

  const todayDockyard: LaunchTask[] = [
    makeLaunchTask("lt-by-sanderling-lift", byLift, sanderling, "08:00", {
      date: WEEK_WED,
      status: "done",
      reservationId: "res-h8-sanderling",
      checklist: ticked("lift"),
    }),
    makeLaunchTask("lt-by-sanderling-launch", byLaunch, sanderling, "14:00", {
      date: WEEK_WED,
      status: "done",
      reservationId: "res-h8-sanderling",
      checklist: ticked("launch"),
    }),
    makeLaunchTask("lt-by-sea-sprite-lift", byLift, seaSprite, "08:00", {
      date: WEEK_MON,
      status: "done",
      reservationId: "res-h4-sea-sprite",
      checklist: ticked("lift"),
    }),
    makeLaunchTask("lt-by-sea-sprite-launch", byLaunch, seaSprite, "14:00", {
      date: WEEK_MON,
      reservationId: "res-h4-sea-sprite",
    }),
    makeLaunchTask("lt-by-riviera-lift", byLift, riviera, "09:00", {
      date: WEEK_TUE,
      status: "done",
      reservationId: "res-h2-riviera",
      checklist: ticked("lift"),
    }),
    makeLaunchTask("lt-by-riviera-launch", byLaunch, riviera, "15:00", {
      date: WEEK_TUE,
      status: "in_progress",
      reservationId: "res-h2-riviera",
    }),
    makeLaunchTask("lt-by-kingfisher-lift", byLift, kingfisher, "09:00", {
      date: WEEK_WED,
      status: "done",
      reservationId: "res-h1-travel-lift",
      checklist: ticked("lift"),
    }),
    makeLaunchTask("lt-by-kingfisher-launch", byLaunch, kingfisher, "15:00", {
      date: WEEK_WED,
      reservationId: "res-h1-travel-lift",
    }),
    makeLaunchTask("lt-by-petrel-lift", byLift, petrel, "10:00", {
      date: FRIDAY,
      reservationId: "res-h3-petrel",
    }),
    makeLaunchTask("lt-by-petrel-launch", byLaunch, petrel, "14:00", {
      date: FRIDAY,
      reservationId: "res-h3-petrel",
    }),
    makeLaunchTask("lt-by-teal-lift", byLift, teal, "11:00", {
      date: FRIDAY,
      status: "in_progress",
      reservationId: "res-h6-teal",
      checklist: itemsFromOptions(byLift.checklist).map((item, index) => ({ ...item, done: index === 0 })),
    }),
    makeLaunchTask("lt-by-teal-launch", byLaunch, teal, "16:00", {
      date: FRIDAY,
      reservationId: "res-h6-teal",
    }),
    makeLaunchTask("lt-by-plover-lift", byLift, plover, "10:00", {
      date: WEEK_WED,
      status: "done",
      reservationId: "res-h7-plover",
      checklist: ticked("lift"),
    }),
    makeLaunchTask("lt-by-plover-launch", byLaunch, plover, "16:00", {
      date: WEEK_WED,
      reservationId: "res-h7-plover",
    }),
  ];

  const todayDry: LaunchTask[] = [
    makeLaunchTask("lt-req-02", dsLaunch, LAUNCH_FLEET[2], "08:30", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
    makeLaunchTask("lt-req-04", dsLaunch, LAUNCH_FLEET[3], "09:30", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
    makeLaunchTask("lt-req-05", dsLaunch, LAUNCH_FLEET[1], "10:00", {
      date: FRIDAY,
      status: "requested",
      source: "customer",
    }),
    makeLaunchTask("lt-ds-dunlin-lift", dsLift, dunlin, "07:00", {
      date: FRIDAY,
      status: "done",
      reservationId: "res-ds4-dunlin",
      checklist: itemsFromOptions(dsLift.checklist).map((item) => ({ ...item, done: true })),
    }),
    makeLaunchTask("lt-ds-dunlin-launch", dsLaunch, dunlin, "12:00", {
      date: FRIDAY,
      status: "in_progress",
      reservationId: "res-ds4-dunlin",
      checklist: itemsFromOptions(dsLaunch.checklist).map((item, index) => ({ ...item, done: index === 0 })),
    }),
    makeLaunchTask("lt-ds-kestrel-launch", dsLaunch, kestrel, "11:00", {
      date: FRIDAY,
      reservationId: "res-ds5-kestrel",
    }),
    makeLaunchTask("lt-ds-osprey-lift", dsLift, osprey, "13:00", {
      date: FRIDAY,
      reservationId: "res-a10-osprey",
    }),
  ];

  const pelicanSaturday: LaunchTask[] = [
    makeLaunchTask("lt-01", dsLaunch, pelican, "09:00"),
    makeLaunchTask("lt-02", dsLift, pelican, "15:00"),
  ];

  const saturdayBusy: LaunchTask[] = [];
  let serial = 3;
  let slotIndex = 0;
  for (let hour = 7; hour < 17; hour += 1) {
    for (const minutes of [0, 30]) {
      const time = padTime(hour, minutes);
      if (time === "09:00" || time === "15:00") continue;
      const client = LAUNCH_FLEET[slotIndex % LAUNCH_FLEET.length];
      const taskType = slotIndex % 2 === 0 ? dsLaunch : dsLift;
      saturdayBusy.push(makeLaunchTask(`lt-${String(serial).padStart(2, "0")}`, taskType, client, time));
      serial += 1;
      slotIndex += 1;
    }
  }

  return [
    ...todayDockyard,
    ...todayDry,
    ...pelicanSaturday,
    ...saturdayBusy,
    makeLaunchTask("lt-other-wash", otherType, pelican, "13:00", { date: FRIDAY }),
  ];
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
  {
    id: "act-3",
    at: `${WEEK_WED}T16:00:00.000Z`,
    actor: "customer",
    message: "T&Cs signed",
    reservationId: "res-h6-teal",
    vesselId: "ves-teal",
    customerId: "cust-diaz",
  },
  {
    id: "act-4",
    at: `${DEMO_TODAY}T07:05:00.000Z`,
    actor: "yard",
    message: "Lift done — back on the rack",
    reservationId: "res-ds4-dunlin",
    vesselId: "ves-dunlin",
    customerId: "cust-brooks",
  },
  {
    id: "act-5",
    at: `${DEMO_TODAY}T08:10:00.000Z`,
    actor: "yard",
    message: "Lift done — on pad H4",
    reservationId: "res-h4-sea-sprite",
    vesselId: "ves-sea-sprite",
    customerId: "cust-voss",
  },
  {
    id: "act-6",
    at: `${DEMO_TODAY}T07:12:00.000Z`,
    actor: "yard",
    message: "Launch done — DIY complete",
    reservationId: "res-h8-sanderling",
    vesselId: "ves-sanderling",
    customerId: "cust-moore",
  },
  {
    id: "act-7",
    at: `${DEMO_TODAY}T10:02:00.000Z`,
    actor: "office",
    message: "Petrel booked onto H3 — 10:00–14:00 antifoul",
    reservationId: "res-h3-petrel",
    vesselId: "ves-petrel",
    customerId: "cust-patel",
  },
  {
    id: "act-8",
    at: `${DEMO_TODAY}T11:05:00.000Z`,
    actor: "yard",
    message: "Lift started on H6",
    reservationId: "res-h6-teal",
    vesselId: "ves-teal",
    customerId: "cust-diaz",
  },
  {
    id: "act-9",
    at: `${DEMO_TODAY}T07:00:00.000Z`,
    actor: "customer",
    message: "Requested launch at 12:00",
    reservationId: "res-h7-plover",
    vesselId: "ves-plover",
    customerId: "cust-owens",
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
  {
    id: "msg-3",
    at: `${DEMO_TODAY}T08:12:00.000Z`,
    customerId: "cust-voss",
    channel: "email",
    template: "launch_confirmed",
    subject: "Launch booked",
    body: "Sea Sprite is on H4. Lift was 08:00. Launch is booked for 14:00 today.",
    read: false,
  },
  {
    id: "msg-4",
    at: `${DEMO_TODAY}T07:00:00.000Z`,
    customerId: "cust-owens",
    channel: "email",
    template: "custom",
    subject: "Launch request received",
    body: "We received your launch request for Plover at 12:00 today. The marina will confirm shortly.",
    read: false,
  },
];

export function createSeedState(): MarinaState {
  const launchTasks = buildLaunchTasks();
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
