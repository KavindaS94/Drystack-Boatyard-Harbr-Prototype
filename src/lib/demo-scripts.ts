import type { PersistedDemoState } from "./demo-persist";

export interface DemoScript {
  id: string;
  title: string;
  to: string;
  steps: string;
}

/** Presenter shortcuts — same four walkthroughs as README, plus the afloat job. */
export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "yard-job",
    title: "Yard-only job",
    to: "/operations/calendar?script=yard-job",
    steps:
      "H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner This invoice → Holding.",
  },
  {
    id: "berth-yard",
    title: "Berth → dockyard",
    to: "/operations/calendar?script=berth-yard",
    steps:
      "A12 (Berth) → Send to Dockyard → pick a spot + Travel lift + Keep berth or Move → Job + T&Cs Sent/Signed → lift done blocked until Signed.",
  },
  {
    id: "afloat",
    title: "Afloat job",
    to: "/operations/calendar?script=afloat",
    steps: "B3 Corsair → Job with Work location: Afloat → log hours → Create draft (no lift needed).",
  },
  {
    id: "saturday",
    title: "Busy Saturday",
    to: "/operations/launch-board?script=saturday",
    steps: "Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark lift done → stored.",
  },
  {
    id: "settings",
    title: "Settings",
    to: "/settings/general-info",
    steps: "Rename Dockyard / Dry stack; add a job type colour; add a product with bank Holding.",
  },
  {
    id: "approve",
    title: "Approve a booking",
    to: "/operations/calendar?script=approve",
    steps:
      "A14 Shearwater is To be approved → Review Agreement → Approve → footer becomes View Agreement + Edit / Move / Archive (Archive blocked while a yard job is open).",
  },
  {
    id: "portal",
    title: "Customer portal round trip",
    to: "/portal/demo-pelican-portal",
    steps:
      "Open portal as Priya (Pelican) → request launch → staff Launch board Approve → Start → Done → portal shows In the water. Or from a reservation: Send status link → Open as customer.",
  },
  {
    id: "dnl",
    title: "Do not launch",
    to: "/portal/demo-tern-portal",
    steps:
      "Tern (Mark Chen) is overdue → portal and board show Do not launch. Or Heron (Sarah Quinn) has expired insurance → update insurance on portal → block clears. Launch board Friday shows customer requests.",
  },
];

const SCRIPT_RESERVATION_IDS: Record<string, string> = {
  "yard-job": "res-h4-sea-sprite",
  "berth-yard": "res-a12-mako",
  afloat: "res-b3-corsair",
  approve: "res-a14-shearwater",
};

export function resolveDemoReservationId(
  state: Pick<PersistedDemoState, "berths" | "reservations" | "vessels">,
  query: { script: string | null; boat: string | null }
): string | null {
  if (query.script) {
    const scriptId = SCRIPT_RESERVATION_IDS[query.script];
    if (scriptId && state.reservations.some((reservation) => reservation.id === scriptId)) {
      return scriptId;
    }
  }

  const boat = query.boat?.trim().toLowerCase();
  if (!boat) return null;

  const berth = state.berths.find((item) => item.name.toLowerCase() === boat);
  if (berth) {
    const onBerth = state.reservations.find((reservation) => reservation.berthId === berth.id);
    if (onBerth) return onBerth.id;
  }

  const vessel = state.vessels.find((item) => item.name.toLowerCase() === boat);
  if (vessel) {
    const forVessel = state.reservations.find((reservation) => reservation.vesselId === vessel.id);
    if (forVessel) return forVessel.id;
  }

  return null;
}
