import type { Job, JobType, Reservation, SpaceKind } from "../../types/domain";

export interface BookingBarProps {
  reservation: Reservation;
  vesselName: string;
  berthKind: SpaceKind;
  jobType?: JobType;
  selected: boolean;
  startOffset: number;
  span: number;
  onSelect: (id: string) => void;
}

export function bookingBarLabel(vesselName: string, job?: Job, jobTypeName?: string): string {
  if (!job) return vesselName;
  const parts = [vesselName];
  if (jobTypeName) parts.push(jobTypeName);
  if (job.liftTime) parts.push(`Lift ${job.liftTime}`);
  if (job.launchTime) parts.push(`Launch ${job.launchTime}`);
  return parts.join(" · ");
}

function contrastText(hex: string): string {
  const raw = hex.replace("#", "");
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#171717" : "#ffffff";
}

function barTone(berthKind: SpaceKind, jobType?: JobType): { className: string; style?: { backgroundColor: string; color: string } } {
  if (jobType) {
    return {
      className: "",
      style: { backgroundColor: jobType.colour, color: contrastText(jobType.colour) },
    };
  }
  if (berthKind === "wet") {
    return { className: "bg-emerald-100 text-emerald-950" };
  }
  return { className: "bg-slate-200 text-slate-800" };
}

export function BookingBar({
  reservation,
  vesselName,
  berthKind,
  jobType,
  selected,
  startOffset,
  span,
  onSelect,
}: BookingBarProps) {
  const label = bookingBarLabel(vesselName, reservation.job, jobType?.name);
  const tone = barTone(berthKind, reservation.job ? jobType : undefined);

  return (
    <button
      type="button"
      title={label}
      data-reservation-id={reservation.id}
      onClick={() => onSelect(reservation.id)}
      className={`absolute top-1 bottom-1 truncate rounded px-2 text-left text-xs font-medium shadow-sm ${tone.className} ${
        selected ? "z-10 ring-2 ring-neutral-900 ring-offset-1" : "hover:brightness-95"
      }`}
      style={{
        left: `calc(${(startOffset / 7) * 100}% + 3px)`,
        width: `calc(${(span / 7) * 100}% - 6px)`,
        ...tone.style,
      }}
    >
      {label}
    </button>
  );
}
