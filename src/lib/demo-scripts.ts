import type { PersistedDemoState } from "./demo-persist";

const SCRIPT_RESERVATION_IDS: Record<string, string> = {
  "yard-job": "res-h4-sea-sprite",
  "berth-yard": "res-a12-mako",
  afloat: "res-b3-corsair",
  approve: "res-a14-shearwater",
  rack: "res-ds5-osprey",
  contractor: "res-h1-travel-lift",
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
