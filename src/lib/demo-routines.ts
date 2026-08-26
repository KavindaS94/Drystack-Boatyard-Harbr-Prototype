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
    intro: "The boat lives on a rack on land. Lift it onto the rack first. The owner then asks for a launch when they want it in the water.",
  },
  {
    id: "yard",
    title: "Boatyard",
    intro: "Pads on land for repair. The yard logs hours and photos with no prices. Office turns that into a draft invoice.",
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
    title: "Boat onto the rack",
    why: "Osprey is still in the water. Lift her onto DS5 so she can be launched later.",
    openLabel: "Open Osprey",
    to: "/operations/calendar?script=rack",
    steps: [
      "Filter the Calendar to Dry stack, or use Open Osprey — she is on DS5, status Launched (still in the water).",
      "Left menu Launch board. Date 14 Aug 2026.",
      "Find 08:00 Lift · Osprey. Click Start, then Done. Status becomes Stored — she is on the rack.",
      "Calendar → Osprey → Create draft invoice. One Lift line ($85). Banner This invoice → Marina.",
    ],
  },
  {
    id: "portal",
    group: "dry",
    title: "Owner requests a launch",
    why: "Pelican is already on the rack. The owner asks for a launch and watches live status.",
    openLabel: "Keep staff on Calendar",
    to: "/operations/calendar?boat=Pelican",
    extra: { label: "Open Pelican portal (new tab)", href: "/portal/demo-pelican-portal", newTab: true },
    steps: [
      "Keep this tab on the Calendar. Open the Pelican portal in a second tab.",
      "Owner: Request a launch, date 14 Aug 2026, Send request.",
      "Staff: Launch board. Pelican is under Customer requests. Approve, then Start, then Done.",
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
      "Date becomes 15 Aug 2026. About 25 launches and 25 lifts.",
      "Use Pelican: 09:00 Launch → Start → Done (Stored → Launched). Departed. 15:00 Lift → Start → Done (Stored).",
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
    title: "Berth boat into the dockyard",
    why: "Mako is on a water berth. Lift her into the yard. T&Cs must be signed before the job can be marked done.",
    openLabel: "Open Mako",
    to: "/operations/calendar?script=berth-yard",
    steps: [
      "A12 Mako → Send to Dockyard. Occupied pads say unavailable.",
      "To see Reservation Conflict, pick H4 → Confirm, then Cancel. Pick an empty pad (H2 or H5) → Confirm.",
      "Keep berth = they still pay for the water. Move = give A12 up.",
      "Send T&Cs, then Send status link → Open as customer → Sign T&Cs. Then Mark job done and Create draft invoice.",
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
      "Pick a free pad (H2 or H5) → Move. The bar moves.",
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
      "Archive is blocked while a yard job is still open.",
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
      "Job types and Launch / lift task types set checklists and QA photos. Add, rename, or remove items there, or on the job / launch row itself.",
      "Products carry the price and bank (Marina or Holding). That bank is the invoice banner.",
    ],
  },
];
