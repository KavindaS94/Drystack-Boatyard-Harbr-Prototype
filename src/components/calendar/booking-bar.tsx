import type { CSSProperties } from "react";
import { dnlStatus } from "../../lib/dnl";
import { useMarina } from "../../store/marina-store";
import type { Job, JobType, Reservation, SpaceKind, VesselStorageStatus, WorkBy } from "../../types/domain";

export interface BookingBarProps {
  reservation: Reservation;
  vesselName: string;
  berthKind: SpaceKind;
  jobType?: JobType;
  storageStatus?: VesselStorageStatus;
  selected: boolean;
  startOffset: number;
  span: number;
  onSelect: (id: string) => void;
}

const WORK_BY_TAG: Record<WorkBy, string> = {
  marina: "",
  diy: "DIY",
  contractor: "Contractor",
};

export function bookingBarLabel(vesselName: string, job?: Job, jobTypeName?: string): string {
  if (!job) return vesselName;
  const parts = [vesselName];
  if (jobTypeName && jobTypeName !== WORK_BY_TAG[job.workBy]) parts.push(jobTypeName);
  if (job.workBy === "contractor" && job.contractorName) parts.push(job.contractorName);
  if (job.liftTime) parts.push(`Lift ${job.liftTime}`);
  if (job.launchTime) parts.push(`Launch ${job.launchTime}`);
  return parts.join(" · ");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "");
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

/**
 * Harbr renders booking bars as soft pastels: a light tint fill, a mid-tone border,
 * and darker text of the same hue (see the real STATUS_COLORS). We mirror that here —
 * job bars derive their pastel from the job-type colour so the colour still codes the job,
 * and wet / dry-storage bars use Harbr's green / blue pastels.
 */
function barTone(
  berthKind: SpaceKind,
  jobType?: JobType,
  storageStatus?: VesselStorageStatus
): CSSProperties {
  if (berthKind !== "wet" && storageStatus === "launched") {
    return {
      backgroundColor: "hsl(173, 58%, 94%)",
      border: "1px dashed hsl(173, 45%, 48%)",
      color: "hsl(173, 70%, 24%)",
    };
  }
  if (berthKind !== "wet" && storageStatus === "departed") {
    return {
      backgroundColor: "hsl(36, 100%, 96%)",
      border: "1px dashed hsl(32, 70%, 62%)",
      color: "hsl(32, 70%, 28%)",
    };
  }
  if (jobType) {
    const { r, g, b } = hexToRgb(jobType.colour);
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.14)`,
      border: `1px solid rgba(${r}, ${g}, ${b}, 0.55)`,
      color: `rgb(${Math.round(r * 0.5)}, ${Math.round(g * 0.5)}, ${Math.round(b * 0.5)})`,
    };
  }
  if (berthKind === "wet") {
    return {
      backgroundColor: "hsl(142, 76%, 94%)",
      border: "1px solid hsl(142, 76%, 78%)",
      color: "hsl(142, 76%, 30%)",
    };
  }
  return {
    backgroundColor: "hsl(210, 100%, 94%)",
    border: "1px solid hsl(210, 100%, 78%)",
    color: "hsl(210, 100%, 32%)",
  };
}

export function BookingBar({
  reservation,
  vesselName,
  berthKind,
  jobType,
  storageStatus,
  selected,
  startOffset,
  span,
  onSelect,
}: BookingBarProps) {
  const { state } = useMarina();
  const customer = state.customers.find((item) => item.id === reservation.customerId);
  const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
  const dnl =
    vessel && customer ? dnlStatus(vessel, customer, state.settings) : { blocked: false, reasons: [] };
  const label = bookingBarLabel(vesselName, reservation.job, jobType?.name);
  const tone = dnl.blocked
    ? {
        backgroundColor: "hsl(0, 86%, 96%)",
        border: "1px solid hsl(0, 70%, 80%)",
        color: "hsl(0, 70%, 32%)",
      }
    : barTone(berthKind, reservation.job ? jobType : undefined, storageStatus);
  const workTag = reservation.job ? WORK_BY_TAG[reservation.job.workBy] : "";
  const statusChip =
    berthKind === "wet"
      ? ""
      : storageStatus === "launched"
        ? "Launched"
        : storageStatus === "departed"
          ? "Departed"
          : "";

  return (
    <button
      type="button"
      title={dnl.blocked ? `${label} — Do not launch: ${dnl.reasons.join("; ")}` : label}
      data-reservation-id={reservation.id}
      data-storage-status={storageStatus ?? ""}
      data-dnl={dnl.blocked ? "blocked" : "clear"}
      onClick={() => onSelect(reservation.id)}
      className={`absolute top-1.5 bottom-1.5 z-10 flex items-center gap-1 overflow-hidden rounded-[4px] px-2 text-left text-xs font-medium transition-shadow ${
        selected
          ? "ring-2 ring-[hsl(252,75%,70%)] ring-offset-1"
          : "hover:brightness-[0.97] hover:shadow-sm"
      }`}
      style={{
        left: `calc(${(startOffset / 7) * 100}% + 3px)`,
        width: `calc(${(span / 7) * 100}% - 6px)`,
        ...tone,
      }}
    >
      <span className="min-w-0 truncate">
        {label}
        {workTag ? ` · ${workTag}` : ""}
      </span>
      {statusChip && !dnl.blocked ? (
        <span
          className={`shrink-0 rounded px-1 py-px text-[10px] font-semibold uppercase tracking-wide ${
            storageStatus === "departed"
              ? "bg-amber-100 text-amber-900"
              : "bg-teal-100 text-teal-800"
          }`}
        >
          {statusChip}
        </span>
      ) : null}
      {dnl.blocked ? (
        <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-red-800">
          Do not launch
        </span>
      ) : null}
    </button>
  );
}
