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
    intro: "The boat lives on a rack on land. Full cycle: water berth → lift onto the rack → launch back into the water.",
  },
  {
    id: "yard",
    title: "Boatyard",
    intro: "Pads on land for repair. Full cycle: water berth → lift into the dockyard → finish the job → move back onto a berth.",
  },
  {
    id: "office",
    title: "Office & portal",
    intro: "These sit on every boat — booking approval, owner edits, messages, and Settings.",
  },
];

export const DEMO_ROUTINES: DemoRoutine[] = [
  {
    id: "rack",
    group: "dry",
    title: "Dry stack: berth → rack → water",
    why: "Osprey starts on berth A10. Send her onto DS5, then launch her back into the water.",
    openLabel: "Open Osprey",
    to: "/operations/calendar?script=rack",
    extra: { label: "Open launch board", href: "/operations/launch-board?script=rack" },
    steps: [
      "Reset demo first if she is already on a rack. Open Osprey on A10 · Berth.",
      "Send to Dry stack. Pick DS5 (empty). Choose Move (free berth) so A10 is given up. Confirm. She is Stored on DS5.",
      "Launch board → Add task → search Osprey → task type Launch → pick a time (e.g. 14:00) → Save.",
      "Open the Launch tab: that Launch. Start, then Done. Badge Stored → Launched.",
      "Calendar: Osprey is on In the water. DS5 is empty. Footer Move → A10 · Berth → Move to put her back on a normal berth.",
      "Calendar → Osprey → Create draft invoice. Launch ($85). Banner This invoice → Marina.",
    ],
  },
  {
    id: "portal",
    group: "dry",
    title: "Owner requests a launch",
    why: "Pelican is already on the rack. After the Osprey cycle, this is the owner-facing half: they ask for a launch and watch live status.",
    openLabel: "Keep staff on Calendar",
    to: "/operations/calendar?boat=Pelican",
    extra: { label: "Open Pelican portal (new tab)", href: "/portal/demo-pelican-portal", newTab: true },
    steps: [
      "Keep this tab on the Calendar. Open the Pelican portal in a second tab.",
      "Owner: Request a launch, date 14 Aug 2026, Send request.",
      "Staff: Launch board. Requests tab — Pelican. Approve — she moves onto the Launch tab. Start, then Done.",
      "Owner status goes Launching now → In the water.",
      "Calendar → Pelican → Create draft invoice (Launch, Marina).",
    ],
  },
  {
    id: "dnl",
    group: "dry",
    title: "Do not launch",
    why: "Overdue account or expired insurance blocks a launch until staff (or the owner, with approval) fix it.",
    openLabel: "Open Tern portal",
    to: "/portal/demo-tern-portal",
    newTab: true,
    extra: { label: "Open Heron portal (insurance)", href: "/portal/demo-heron-portal", newTab: true },
    steps: [
      "Tern (Mark Chen): red Account overdue. No Send request. Calendar bar says Do not launch.",
      "Heron (Sarah Quinn): expired insurance. Owner edits the date → Save. Amber: waiting for marina approval.",
      "Staff: Dashboard → Actions → Pending Changes. Reject with a reason, or Approve. Approve clears the insurance DNL.",
    ],
  },
  {
    id: "saturday",
    group: "dry",
    title: "Busy Saturday",
    why: "Replaces a printed list of ~50 launches and lifts. Invoice after the trips are Done, not after every tap.",
    openLabel: "Open Saturday board",
    to: "/operations/launch-board?script=saturday",
    steps: [
      "Date becomes 15 Aug 2026. About 25 launches and 25 lifts, on the Launch and Lift tabs.",
      "Use Pelican: Launch tab 09:00 Launch → Start → Done (Stored → Launched). Departed. Lift tab 15:00 Lift → Start → Done (Stored).",
      "Calendar → Pelican → Create draft invoice. Launch + Lift. Banner Marina.",
      "If Pelican is already in the water from an earlier demo, Reset demo first.",
    ],
  },
  {
    id: "yard-job",
    group: "yard",
    title: "Yard job — crew logs, office invoices",
    why: "Sea Sprite is already on a dockyard pad. Yard logs work with no $. Office creates the draft.",
    openLabel: "Open Sea Sprite",
    to: "/operations/calendar?script=yard-job",
    extra: { label: "Open Yard tablet", href: "/operations/tablet" },
    steps: [
      "H4 Sea Sprite — Job is open (checklist, hours, materials).",
      "Yard tablet → search Sea Sprite. Tick checklist, Add hours/materials, tick photos. No dollar amounts.",
      "Back on the Calendar, Sea Sprite → Create draft invoice. Labour, parts, and Dockyard fee. Banner Holding.",
    ],
  },
  {
    id: "berth-yard",
    group: "yard",
    title: "Dockyard: berth → yard → berth",
    why: "Mako starts on A12. Send her into the dockyard, finish the job, move her back onto the water.",
    openLabel: "Open Mako",
    to: "/operations/calendar?script=berth-yard",
    extra: { label: "Open Yard tablet", href: "/operations/tablet" },
    steps: [
      "Reset demo first if A12 is empty. Open Mako on A12.",
      "Send to Dockyard. Pick an empty pad (H5). Choose Move (free berth) so A12 is given up. Confirm. Keep berth = they still pay for A12 while she is in the yard.",
      "To see Reservation Conflict, pick H4 (Sea Sprite) → Confirm, then Cancel.",
      "Job: Send T&Cs, then Mark signed (or Send status link → Open as customer → Sign T&Cs). Mark job done stays off until signed.",
      "Yard tablet (optional): search Mako, tick checklist / photos, Add hours. No dollar amounts.",
      "Back on the Calendar: Mark job done.",
      "A12 is empty. Footer Move → A12 · Berth → Move. Mako is back on the water berth. The dockyard pad is free.",
      "Create draft invoice. Dockyard fee (min 1 day), no berth night. Banner This invoice → Holding.",
    ],
  },
  {
    id: "move",
    group: "yard",
    title: "Move a boat (conflict check)",
    why: "Move checks whether the destination is free. Occupied pads show the same Reservation Conflict dialog as live Harbr.",
    openLabel: "Open Sea Sprite",
    to: "/operations/calendar?script=yard-job",
    steps: [
      "H4 Sea Sprite → footer Move.",
      "Pick H1 · Dockyard (Kingfisher is there) → Move. Conflict dialog. Cancel.",
      "Pick a free pad (H3 or H5) → Move. The bar moves.",
    ],
  },
  {
    id: "afloat",
    group: "yard",
    title: "Afloat job",
    why: "Engine work in the water at the berth. No lift, no dockyard fee.",
    openLabel: "Open Corsair",
    to: "/operations/calendar?script=afloat",
    steps: [
      "B3 Corsair — Job, Work location: Afloat.",
      "Add hours → Create draft invoice. Labour only. Banner Holding. No Dockyard fee.",
    ],
  },
  {
    id: "contractor",
    group: "yard",
    title: "Contractor, relaunch, photos",
    why: "Kingfisher is a contractor job. You can notify them, move the relaunch date, and tick QA photos.",
    openLabel: "Open Kingfisher",
    to: "/operations/calendar?script=contractor",
    extra: { label: "Open Yard tablet", href: "/operations/tablet" },
    steps: [
      "H1 Kingfisher. Who does the work = Contractor (Marine Works). Notify sends a simulated email.",
      "Move relaunch — pick a later date. The booking extends if needed; the owner gets an SMS.",
      "Yard tablet → Kingfisher → tick the two photo boxes. Mark job done waits until T&Cs are signed.",
    ],
  },
  {
    id: "owner-changes",
    group: "office",
    title: "Approve owner changes",
    why: "Contact and insurance edits from the portal wait in Actions. Staff approve or reject with a reason.",
    openLabel: "Open Actions",
    to: "/dashboard/actions",
    extra: { label: "Open Heron portal (new tab)", href: "/portal/demo-heron-portal", newTab: true },
    steps: [
      "Owner: Heron portal → Edit insurance → Save. Amber pending chip. DNL stays until staff approve.",
      "Staff: Actions → Pending Changes. Field | Current | Requested.",
      "Reject needs a reason (owner resubmits). Approve applies the date and clears the insurance DNL.",
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
      "A14 Shearwater, or Actions → Pending Approvals → Review Agreement.",
      "Approve reservation. Then you get View Agreement, Edit, Move, Archive.",
      "Book another places that owner on a berth, Dry stack rack, or Dockyard pad. Keep berth or free it if they already occupy a space.",
      "Archive is blocked while a yard job is still open.",
    ],
  },
  {
    id: "place-booking",
    group: "office",
    title: "Book onto Dry stack or Dockyard",
    why: "Add a boat onto an empty rack or pad, or send a berth boat to Dry stack. Keep the water berth or free it.",
    openLabel: "Open Calendar",
    to: "/operations/calendar",
    steps: [
      "Click empty DS7 (or an empty Dockyard pad). Pick Gannet (not booked) → Confirm.",
      "A12 Mako → Send to Dry stack. Keep berth = still on A12 and on the rack. Move (free berth) = A12 empty; later Move can put them back on a berth.",
      "Footer Book another — pick any space. Dockyard asks for a job type. Occupied spaces show Reservation Conflict.",
    ],
  },
  {
    id: "message",
    group: "office",
    title: "Message the owner",
    why: "Status link and templates show on the panel and in the portal Updates list.",
    openLabel: "Open Pelican",
    to: "/operations/calendar?boat=Pelican",
    steps: [
      "Send status link → SMS or Email → Send link. Copy link or Open as customer.",
      "Messages → Send message → pick a template → Send.",
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
      "Modules & words — hide Boatyard or Dry stack, or turn off auto DNL / portal requests.",
      "Settings → Checklists sets the option labels under each row. Job types and Launch / lift task types pick one per item, and assign the product on the draft.",
      "Products carry the price and bank (Marina or Holding). That bank is the invoice banner.",
    ],
  },
];
