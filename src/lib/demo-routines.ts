export type DemoRoutineGroup = "dry" | "yard" | "office";

export interface DemoRoutine {
  id: string;
  group: DemoRoutineGroup;
  title: string;
  why: string;
  openLabel: string;
  to: string;
  newTab?: boolean;
  extra?: { label: string; href: string; newTab?: boolean };
  steps: string[];
}

export const DEMO_ROUTINE_GROUPS: { id: DemoRoutineGroup; title: string; intro: string }[] = [
  {
    id: "dry",
    title: "Dry stack",
    intro: "The boat lives on a rack. Launch her into the water from Dry stack — not from the Calendar.",
  },
  {
    id: "yard",
    title: "Boatyard",
    intro: "The yard is for repair. Book onto it from Dockyard, finish the job, then launch back to the water.",
  },
  {
    id: "office",
    title: "Office",
    intro: "These sit on every boat — booking approval, messages, Settings, and email to the owner.",
  },
];

export const DEMO_ROUTINES: DemoRoutine[] = [
  {
    id: "rack",
    group: "dry",
    title: "Dry stack: rack → water",
    why: "Pelican is already on a rack. Launch her into the water from Dry stack.",
    openLabel: "Open Pelican",
    to: "/operations/dry-stack?tab=occupancy&script=rack",
    extra: { label: "Open Dry stack Today", href: "/operations/dry-stack?tab=launch&script=rack" },
    steps: [
      "Reset demo first if she is already in the water. Dry stack → Racks → Pelican.",
      "Dry stack → Today → Add task → search Pelican → Launch → pick a time → Save.",
      "Launch tab: Start, then Done. Badge Stored → Launched.",
      "On that row: Invoice Lift + Launch (if the Lift is still unbilled). Banner This invoice → Marina.",
      "Dry stack → Racks: Pelican is on In the water. Boat workspace still invoices unbilled Lift/Launch.",
    ],
  },
  {
    id: "log-request",
    group: "dry",
    title: "Staff logs a launch request",
    why: "Pelican is already on the rack. Staff book a launch on the fork lift, then yard puts her in.",
    openLabel: "Open Dry stack",
    to: "/operations/dry-stack",
    extra: { label: "Open fork lift", href: "/operations/dry-stack?tab=fork-lift" },
    steps: [
      "Dry stack → Today → Add task. Search Pelican, Launch, pick a free fork-lift slot → Save. Customer is emailed.",
      "Launch tab — Pelican. Start, then Done.",
      "Boat on the row (or Racks → Pelican) → Create draft invoice (Launch, Marina).",
    ],
  },
  {
    id: "dnl",
    group: "dry",
    title: "Do not launch",
    why: "Overdue account or expired insurance blocks a launch until staff fix it.",
    openLabel: "Open Tern",
    to: "/operations/dry-stack?tab=occupancy&boat=Tern",
    extra: { label: "Open Heron", href: "/operations/dry-stack?tab=occupancy&boat=Heron" },
    steps: [
      "Dry stack → Racks → Tern (Mark Chen): red Account overdue. Launch Start stays grey.",
      "Heron (Sarah Quinn): expired insurance — same DNL until office updates insurance on the boat workspace.",
    ],
  },
  {
    id: "saturday",
    group: "dry",
    title: "Busy Saturday",
    why: "One vessel per fork-lift slot. Invoice after the trips are Done, not after every tap.",
    openLabel: "Open Saturday board",
    to: "/operations/dry-stack?script=saturday",
    extra: { label: "Open fork lift", href: "/operations/dry-stack?tab=fork-lift&script=saturday" },
    steps: [
      "Date becomes this Saturday. Unique 30-minute fork-lift slots on Launch and Lift.",
      "Use Pelican: Launch tab 09:00 Launch → Start → Done (Stored → Launched). Departed. Lift tab 15:00 Lift → Start → Done (Stored).",
      "Fork lift tab: click a free hour to book, or a booked hour to open that boat. Taken slots conflict.",
      "Pelican boat workspace → Create draft invoice. Launch + Lift. Banner Marina.",
      "If Pelican is already in the water from an earlier demo, Reset demo first.",
    ],
  },
  {
    id: "yard-job",
    group: "yard",
    title: "Yard job — crew logs, office invoices",
    why: "Sea Sprite is already on a dockyard pad. Yard logs work with no $. Office creates the draft.",
    openLabel: "Open Sea Sprite",
    to: "/operations/boatyard?tab=jobs&script=yard-job",
    extra: { label: "Open yard crew", href: "/yard" },
    steps: [
      "Dockyard → Job details → Sea Sprite. Job is open (checklist, hours, materials).",
      "User menu → Open yard crew (separate page, no office sidebar). Search Sea Sprite. Tick checklist, Add hours/materials, tick photos. No dollar amounts.",
      "Back on Dockyard, Sea Sprite workspace → Create draft invoice. Labour, parts, and Dockyard fee. Banner Holding.",
    ],
  },
  {
    id: "berth-yard",
    group: "yard",
    title: "Dockyard: book a pad job",
    why: "Book onto an empty dockyard pad from Dockyard, finish the job, then launch back to the water.",
    openLabel: "Open Dockyard yard",
    to: "/operations/boatyard?tab=yard",
    extra: { label: "Open yard crew", href: "/yard" },
    steps: [
      "Dockyard → Yard → click empty H5. Pick a boat that is not on a water berth (Gannet). Job type Engine service, lift 09:00. Confirm.",
      "To see Reservation Conflict, pick H4 (Sea Sprite) → Confirm, then Cancel.",
      "Job: Send T&Cs (email), then Mark signed. Mark job done stays off until signed.",
      "Every job lifts first, then the work, then launch. Travel lift tab shows the booked Lift. When the job is ready: Schedule launch / Change launch date — slot is checked, customer emailed.",
      "Create draft invoice. Dockyard fee (min 1 day), no berth night. Banner This invoice → Holding.",
    ],
  },
  {
    id: "move",
    group: "yard",
    title: "Move a boat (conflict check)",
    why: "Move checks whether the destination is free. Occupied pads show the same Reservation Conflict dialog as live Harbr.",
    openLabel: "Open Sea Sprite",
    to: "/operations/boatyard?tab=jobs&script=yard-job",
    steps: [
      "Dockyard → Job details → Sea Sprite → Move.",
      "Pick H1 · Dockyard (Kingfisher is there) → Move. Conflict dialog. Cancel.",
      "Pick a free pad (H5) → Move. The bar moves.",
    ],
  },
  {
    id: "contractor",
    group: "yard",
    title: "Contractor, relaunch, photos",
    why: "Kingfisher is a contractor job. You can notify them, move the relaunch date, and tick QA photos.",
    openLabel: "Open Kingfisher",
    to: "/operations/boatyard?tab=jobs&script=contractor",
    extra: { label: "Open travel lift", href: "/operations/boatyard?tab=travel-lift" },
    steps: [
      "Dockyard → Job details → Kingfisher. Job type is Engine service. Who does the work = Contractor (Marine Works). Notify sends a simulated email.",
      "Lift then launch is on every job — move the launch to a later free slot. The owner is emailed.",
      "Travel lift tab shows the booked hours. Yard crew → Kingfisher → tick the two photo boxes. Mark job done waits until T&Cs are signed.",
    ],
  },
  {
    id: "owner-changes",
    group: "office",
    title: "Approve owner changes",
    why: "Contact and insurance edits wait in Actions. Staff approve or reject with a reason.",
    openLabel: "Open Actions",
    to: "/dashboard/actions",
    extra: { label: "Open Heron", href: "/operations/dry-stack?tab=occupancy&boat=Heron" },
    steps: [
      "Dry stack → Racks → Heron: expired insurance — DNL until office updates the date on the boat workspace.",
      "Actions → Pending Changes if any owner edits are waiting (phone/email logged by staff).",
      "Reject needs a reason. Approve applies the date and can clear the insurance DNL.",
    ],
  },
  {
    id: "approve",
    group: "office",
    title: "Approve a booking",
    why: "Shearwater is To be approved. Same flow as live Harbr Actions.",
    openLabel: "Open Shearwater",
    to: "/operations/calendar?script=approve",
    extra: { label: "Open Actions", href: "/dashboard/actions" },
    steps: [
      "A14 Shearwater on Calendar, or Actions → Pending Approvals → Review Agreement.",
      "Approve reservation. Then you get View Agreement, Edit, Move, Archive.",
      "Book another from a water berth only lists other berths. From Dockyard you can book another pad.",
      "Archive is blocked while a yard job is still open.",
    ],
  },
  {
    id: "place-booking",
    group: "office",
    title: "Book onto Dry stack or Dockyard",
    why: "Add a boat onto an empty rack or pad from that module. Water berth boats stay on the Calendar.",
    openLabel: "Open Dry stack racks",
    to: "/operations/dry-stack?tab=occupancy",
    extra: { label: "Open Dockyard yard", href: "/operations/boatyard?tab=yard" },
    steps: [
      "Dry stack → Racks → click empty DS7. Pick a boat that is not on a water berth → Confirm.",
      "Dockyard → Yard → empty H5. Job type required. Occupied pads show Reservation Conflict.",
      "Boat workspace Book another — from a water berth you only get other berths. From Dockyard you can book another pad.",
    ],
  },
  {
    id: "message",
    group: "office",
    title: "Message the owner",
    why: "Status emails and templates show on the boat workspace.",
    openLabel: "Open Pelican",
    to: "/operations/dry-stack?tab=occupancy&boat=Pelican",
    steps: [
      "Email status → Send email. A simulated email is logged under Messages.",
      "Messages → Send message → pick a template → Send (email).",
      "Activity is the staff log. Notes: type, Save.",
    ],
  },
  {
    id: "settings",
    group: "office",
    title: "Settings",
    why: "Turn modules on or off, rename Dockyard / Dry stack, and set products and banks.",
    openLabel: "Open Settings",
    to: "/settings/general-info",
    steps: [
      "Modules & words — independently hide Boatyard or Dry stack. That module disappears from Operations. Equipment tab sets travel-lift / fork-lift hours and slot length.",
      "Settings → Checklists sets the option labels under each row. Job types and Launch / lift task types pick one per item, and assign the product on the draft.",
      "Products carry the price and bank (Marina or Holding). That bank is the invoice banner.",
    ],
  },
];
