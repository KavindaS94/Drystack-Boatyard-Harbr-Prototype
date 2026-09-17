import type { PersistedDemoState } from "./demo-persist";
import type { SpaceKind } from "../types/domain";

const SCRIPT_RESERVATION_IDS: Record<string, string> = {
  "yard-job": "res-h4-sea-sprite",
  "berth-yard": "res-h4-sea-sprite",
  approve: "res-a14-shearwater",
  rack: "res-ds1-pelican",
  contractor: "res-h1-travel-lift",
};

export function kindFromPath(pathname: string): SpaceKind | null {
  if (pathname.startsWith("/operations/dry-stack")) return "dry_storage";
  if (pathname.startsWith("/operations/boatyard")) return "boatyard";
  if (pathname.startsWith("/operations/calendar") || pathname === "/calendar") return "wet";
  return null;
}

export function resolveDemoReservationId(
  state: Pick<PersistedDemoState, "berths" | "reservations" | "vessels">,
  query: { script: string | null; boat: string | null; res?: string | null; kind?: SpaceKind | null }
): string | null {
  if (query.res && state.reservations.some((reservation) => reservation.id === query.res)) {
    return query.res;
  }

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
  if (!vessel) return null;

  const matches = state.reservations.filter(
    (reservation) => reservation.vesselId === vessel.id && reservation.status !== "archived"
  );
  if (query.kind) {
    const onKind = matches.find((reservation) => {
      const space = state.berths.find((item) => item.id === reservation.berthId);
      return space?.kind === query.kind;
    });
    if (onKind) return onKind.id;
  }

  return matches[0]?.id ?? null;
}
