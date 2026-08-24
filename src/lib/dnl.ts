import type { Customer, Settings, Vessel } from "../types/domain";
import { DEMO_TODAY } from "./demo-dates";

export interface DnlStatus {
  blocked: boolean;
  reasons: string[];
}

function formatExpiry(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[month - 1]} ${year}`;
}

/** Compare YYYY-MM-DD strings; insurance is expired when expiry < today. */
export function isInsuranceExpired(expiry: string, today: string): boolean {
  return expiry < today;
}

export function dnlStatus(
  vessel: Vessel,
  customer: Customer,
  settings: Settings,
  today: string = DEMO_TODAY
): DnlStatus {
  const reasons: string[] = [];

  if (vessel.dnlOverride?.active) {
    reasons.push(vessel.dnlOverride.reason || "Manual do-not-launch override");
  }

  if (settings.autoDnlOverdue && customer.accountOverdue) {
    reasons.push("Account overdue");
  }

  if (settings.autoDnlInsurance && isInsuranceExpired(vessel.insuranceExpiry, today)) {
    reasons.push(`Insurance expired ${formatExpiry(vessel.insuranceExpiry)}`);
  }

  return { blocked: reasons.length > 0, reasons };
}

export function dnlReasonText(status: DnlStatus): string {
  if (!status.blocked) return "";
  return status.reasons.join("; ");
}
