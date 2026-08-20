import type { Job, Reservation, ReservationStatus } from "../types/domain";

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  to_be_approved: "To be approved",
  approved: "Approved",
  archived: "Archived",
};

export const RESERVATION_STATUS_COLOR: Record<ReservationStatus, string> = {
  pending: "hsl(36, 100%, 46%)",
  to_be_approved: "hsl(252, 75%, 30%)",
  approved: "hsl(142, 76%, 35%)",
  archived: "hsl(0, 0%, 45%)",
};

export function normalizeReservationStatus(value: unknown): ReservationStatus {
  if (value === "pending" || value === "to_be_approved" || value === "approved" || value === "archived") {
    return value;
  }
  return "approved";
}

/** Purple agreement CTA — Harbr hides it once the booking is approved. */
export function agreementPrimaryLabel(status: ReservationStatus): string | null {
  if (status === "to_be_approved") return "Review Agreement";
  if (status === "pending") return "View and Edit Agreement";
  return null;
}

export function showsViewAgreementLink(status: ReservationStatus): boolean {
  return status === "approved";
}

export function canEditOrMove(status: ReservationStatus): boolean {
  return status === "pending" || status === "to_be_approved" || status === "approved";
}

export function archiveBlockReason(status: ReservationStatus, job?: Job): string | null {
  if (status === "archived") return "This reservation is already archived.";
  if (job?.status === "open") return "Finish the yard job before archiving.";
  return null;
}

export function moveBlockReason(status: ReservationStatus): string | null {
  if (!canEditOrMove(status)) return "Archived reservations cannot be moved.";
  return null;
}

export function withReservationDefaults(reservation: Reservation): Reservation {
  return {
    ...reservation,
    status: normalizeReservationStatus(reservation.status),
  };
}
