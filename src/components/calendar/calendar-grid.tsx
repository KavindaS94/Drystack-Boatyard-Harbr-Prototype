import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useMarina } from "../../store/marina-store";
import type { Berth, Reservation } from "../../types/domain";
import { BookingBar } from "./booking-bar";

const PURPLE_OUTLINE = "hsl(252, 75%, 80%)";
const PURPLE_TEXT = "hsl(252, 75%, 60%)";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function toLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, days: number): string {
  const date = toLocalDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function mondayOf(iso: string): string {
  const date = toLocalDate(iso);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(iso, offset);
}

function daysBetween(start: string, end: string): number {
  const ms = toLocalDate(end).getTime() - toLocalDate(start).getTime();
  return Math.round(ms / 86_400_000);
}

function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function weekTitle(weekStart: string): string {
  const start = toLocalDate(weekStart);
  const end = toLocalDate(addDays(weekStart, 6));
  const endLabel = `${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${endLabel}`;
  }
  return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${endLabel}`;
}

function groupByPier(berths: Berth[]): { pier: string; berths: Berth[] }[] {
  const groups: { pier: string; berths: Berth[] }[] = [];
  for (const berth of berths) {
    const last = groups[groups.length - 1];
    if (last && last.pier === berth.pier) last.berths.push(berth);
    else groups.push({ pier: berth.pier, berths: [berth] });
  }
  return groups;
}

function clipToWeek(reservation: Reservation, weekStart: string, weekEnd: string) {
  if (reservation.endDate < weekStart || reservation.startDate > weekEnd) return null;
  const clippedStart = reservation.startDate < weekStart ? weekStart : reservation.startDate;
  const clippedEnd = reservation.endDate > weekEnd ? weekEnd : reservation.endDate;
  return {
    startOffset: daysBetween(weekStart, clippedStart),
    span: daysBetween(clippedStart, clippedEnd) + 1,
  };
}

export function CalendarGrid() {
  const { state, setSelectedReservationId } = useMarina();
  const [weekStart, setWeekStart] = useState(() => mondayOf(state.selectedDate));
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const weekEnd = days[6];

  const { settings, kindFilter } = state;
  const visibleBerths = state.berths.filter((berth) => {
    if (!kindFilter.includes(berth.kind)) return false;
    if (berth.kind === "boatyard" && !settings.boatyardEnabled) return false;
    if (berth.kind === "dry_storage" && !settings.dryStorageEnabled) return false;
    return true;
  });
  const pierGroups = groupByPier(visibleBerths);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-primary-lighter"
          style={{ borderColor: PURPLE_OUTLINE, color: PURPLE_TEXT }}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-800">{weekTitle(weekStart)}</p>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-primary-lighter"
          style={{ borderColor: PURPLE_OUTLINE, color: PURPLE_TEXT }}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[52rem]">
          <div className="grid grid-cols-[152px_repeat(7,minmax(0,1fr))] border-b border-border bg-gray-50">
            <div className="border-r border-border" />
            {days.map((iso) => {
              const date = toLocalDate(iso);
              return (
                <div key={iso} className="border-l border-border px-2 py-2 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {WEEKDAY_SHORT[date.getDay()]}
                  </p>
                  <p className="text-sm font-semibold text-neutral-800">{date.getDate()}</p>
                </div>
              );
            })}
          </div>

          {pierGroups.map((group) => (
            <div key={group.pier}>
              <div className="border-b border-border bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.pier}
              </div>
              {group.berths.map((berth) => (
                <BerthRow
                  key={berth.id}
                  berth={berth}
                  days={days}
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  reservations={state.reservations.filter((item) => item.berthId === berth.id)}
                  selectedReservationId={state.selectedReservationId}
                  onSelect={setSelectedReservationId}
                />
              ))}
            </div>
          ))}

          {pierGroups.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500">No berths for this kind.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface BerthRowProps {
  berth: Berth;
  days: string[];
  weekStart: string;
  weekEnd: string;
  reservations: Reservation[];
  selectedReservationId: string | null;
  onSelect: (id: string) => void;
}

function BerthRow({
  berth,
  days,
  weekStart,
  weekEnd,
  reservations,
  selectedReservationId,
  onSelect,
}: BerthRowProps) {
  const { state } = useMarina();

  return (
    <div className="grid grid-cols-[152px_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0">
      <div className="flex h-12 items-center border-r border-border bg-white px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{berth.name}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {berth.lengthM} × {berth.beamM} m
          </p>
        </div>
      </div>
      <div className="relative col-span-7 grid grid-cols-7">
        {days.map((iso) => (
          <div key={iso} className="h-12 border-l border-border hover:bg-gray-50" />
        ))}
        {reservations.map((reservation) => {
          const placement = clipToWeek(reservation, weekStart, weekEnd);
          if (!placement) return null;
          const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
          const jobType = reservation.job
            ? state.jobTypes.find((item) => item.id === reservation.job?.typeId)
            : undefined;
          return (
            <BookingBar
              key={reservation.id}
              reservation={reservation}
              vesselName={vessel?.name ?? reservation.vesselId}
              berthKind={berth.kind}
              jobType={jobType}
              selected={selectedReservationId === reservation.id}
              startOffset={placement.startOffset}
              span={placement.span}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
