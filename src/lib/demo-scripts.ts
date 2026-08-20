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
    to: "/calendar?script=yard-job",
    steps:
      "H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner This invoice → Holding.",
  },
  {
    id: "berth-yard",
    title: "Berth → dockyard",
    to: "/calendar?script=berth-yard",
    steps:
      "A12 (Berth) → Send to Dockyard → pick a spot + Travel lift + Keep berth or Move → Job + T&Cs Sent/Signed → lift done blocked until Signed.",
  },
  {
    id: "afloat",
    title: "Afloat job",
    to: "/calendar?script=afloat",
    steps: "B3 Corsair → Job with Work location: Afloat → log hours → Create draft (no lift needed).",
  },
  {
    id: "saturday",
    title: "Busy Saturday",
    to: "/launch-board?script=saturday",
    steps: "Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark lift done → stored.",
  },
  {
    id: "settings",
    title: "Settings",
    to: "/settings",
    steps: "Rename Dockyard / Dry stack; add a job type colour; add a product with bank Holding.",
  },
];

const SCRIPT_RESERVATION_IDS: Record<string, string> = {
  "yard-job": "res-h4-sea-sprite",
  "berth-yard": "res-a12-mako",
  afloat: "res-b3-corsair",
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
