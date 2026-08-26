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

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
