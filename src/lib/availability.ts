import type { Berth, Reservation } from "../types/domain";

export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && startB <= endA;
}

export function findBerthConflict(
  reservations: Reservation[],
  berthId: string,
  start: string,
  end: string,
  excludeReservationId?: string
): Reservation | undefined {
  return reservations.find(
    (item) =>
      item.status !== "archived" &&
      item.id !== excludeReservationId &&
      item.berthId === berthId &&
      datesOverlap(item.startDate, item.endDate, start, end)
  );
}

export interface BerthConflictDetails {
  berthName: string;
  startDate: string;
  endDate: string;
}

export function conflictDetailsForBerth(
  reservations: Reservation[],
  berths: Berth[],
  berthId: string,
  start: string,
  end: string,
  excludeReservationId?: string
): BerthConflictDetails | null {
  const conflict = findBerthConflict(reservations, berthId, start, end, excludeReservationId);
  if (!conflict) return null;
  const berth = berths.find((item) => item.id === berthId);
  return {
    berthName: berth?.name ?? berthId,
    startDate: conflict.startDate,
    endDate: conflict.endDate,
  };
}

export function liveReservationsForVessel(
  reservations: Reservation[],
  vesselId: string
): Reservation[] {
  return reservations.filter((item) => item.vesselId === vesselId && item.status !== "archived");
}

/** Prefer the water berth when a boat already occupies more than one space. */
export function sourceReservationForVessel(
  reservations: Reservation[],
  berths: Berth[],
  vesselId: string,
  destBerthId?: string
): Reservation | undefined {
  const live = liveReservationsForVessel(reservations, vesselId).filter(
    (item) => item.berthId !== destBerthId
  );
  if (live.length === 0) return undefined;
  const wet = live.find((item) => berths.find((berth) => berth.id === item.berthId)?.kind === "wet");
  return wet ?? live[0];
}

export function hasLiveWetReservation(
  reservations: Reservation[],
  berths: Berth[],
  vesselId: string
): boolean {
  return liveReservationsForVessel(reservations, vesselId).some(
    (item) => berths.find((berth) => berth.id === item.berthId)?.kind === "wet"
  );
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
