import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDays, toLocalDate } from "../../lib/iso-date";
import { occupiesDryRack } from "../../lib/status";
import { useMarina } from "../../store/marina-store";
import type { Berth, Reservation } from "../../types/domain";
import { PlaceBookingModal } from "../reservation-panel/place-booking-modal";
import { Button } from "../ui/button";
import { BookingBar } from "./booking-bar";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

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
  const indexByPier = new Map<string, number>();
  for (const berth of berths) {
    const index = indexByPier.get(berth.pier);
    if (index === undefined) {
      indexByPier.set(berth.pier, groups.length);
      groups.push({ pier: berth.pier, berths: [berth] });
    } else {
      groups[index].berths.push(berth);
    }
  }
  for (const group of groups) {
    group.berths.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
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

  useEffect(() => {
    setWeekStart(mondayOf(state.selectedDate));
  }, [state.selectedDate]);
  const [addTarget, setAddTarget] = useState<{ berthId: string; start: string } | null>(null);
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
  const vesselById = new Map(state.vessels.map((vessel) => [vessel.id, vessel]));
  const berthById = new Map(state.berths.map((berth) => [berth.id, berth]));
  const showDryStack = visibleBerths.some((berth) => berth.kind === "dry_storage");
  const inWaterReservations = showDryStack
    ? state.reservations.filter((item) => {
        if (item.status === "archived") return false;
        const berth = berthById.get(item.berthId);
        if (berth?.kind !== "dry_storage") return false;
        const vessel = vesselById.get(item.vesselId);
        if (vessel?.storageStatus !== "launched") return false;
        const onWetBerth = state.reservations.some((other) => {
          if (other.id === item.id || other.status === "archived" || other.vesselId !== item.vesselId) {
            return false;
          }
          return berthById.get(other.berthId)?.kind === "wet";
        });
        return !onWetBerth;
      })
    : [];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
        <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-gray-50 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Previous week"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="h-8 w-8 rounded-none border-gray-200 border-r p-0 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Next week"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="h-8 w-8 rounded-none p-0 hover:bg-gray-100"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <p className="text-sm font-semibold text-neutral-800">{weekTitle(weekStart)}</p>
        <div className="w-16" />
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
              {group.berths.some((berth) => berth.kind === "dry_storage") ? (
                <InWaterRow
                  days={days}
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  reservations={inWaterReservations}
                  selectedReservationId={state.selectedReservationId}
                  onSelect={setSelectedReservationId}
                />
              ) : null}
              {group.berths.map((berth) => (
                <BerthRow
                  key={berth.id}
                  berth={berth}
                  days={days}
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  reservations={state.reservations.filter((item) => {
                    if (item.berthId !== berth.id || item.status === "archived") return false;
                    if (berth.kind !== "dry_storage") return true;
                    const vessel = vesselById.get(item.vesselId);
                    return !vessel || occupiesDryRack(vessel.storageStatus);
                  })}
                  selectedReservationId={state.selectedReservationId}
                  onSelect={setSelectedReservationId}
                  onAddDay={
                    state.role === "office"
                      ? (iso) => setAddTarget({ berthId: berth.id, start: iso })
                      : undefined
                  }
                />
              ))}
            </div>
          ))}

          {pierGroups.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500">No berths for this kind.</p>
          ) : null}
        </div>
      </div>
      {addTarget ? (
        <PlaceBookingModal
          title="Add booking"
          destBerthId={addTarget.berthId}
          startDate={addTarget.start}
          onClose={() => setAddTarget(null)}
        />
      ) : null}
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
  onAddDay?: (iso: string) => void;
}

function BerthRow({
  berth,
  days,
  weekStart,
  weekEnd,
  reservations,
  selectedReservationId,
  onSelect,
  onAddDay,
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
          <button
            key={iso}
            type="button"
            aria-label={`Add booking on ${berth.name} ${iso}`}
            data-add-booking-day={iso}
            data-add-booking-berth={berth.id}
            disabled={!onAddDay}
            onClick={() => onAddDay?.(iso)}
            className="h-12 border-l border-border hover:bg-gray-50 disabled:hover:bg-transparent"
          />
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
              storageStatus={vessel?.storageStatus}
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

interface InWaterRowProps {
  days: string[];
  weekStart: string;
  weekEnd: string;
  reservations: Reservation[];
  selectedReservationId: string | null;
  onSelect: (id: string) => void;
}

function InWaterRow({
  days,
  weekStart,
  weekEnd,
  reservations,
  selectedReservationId,
  onSelect,
}: InWaterRowProps) {
  const { state } = useMarina();
  const placed = reservations
    .map((reservation) => {
      const placement = clipToWeek(reservation, weekStart, weekEnd);
      if (!placement) return null;
      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
      return { reservation, placement, vessel };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const laneHeight = 40;
  const rowHeight = Math.max(48, placed.length * laneHeight + 8);

  if (placed.length === 0) return null;

  return (
    <div
      className="grid grid-cols-[152px_repeat(7,minmax(0,1fr))] border-b border-border"
      data-calendar-lane="in-water"
    >
      <div className="flex items-center border-r border-border bg-teal-50/60 px-3" style={{ minHeight: rowHeight }}>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-teal-900">In the water</p>
          <p className="truncate text-xs font-medium text-teal-800/70">Not on the rack</p>
        </div>
      </div>
      <div className="relative col-span-7 grid grid-cols-7" style={{ minHeight: rowHeight }}>
        {days.map((iso) => (
          <div key={iso} className="border-l border-border hover:bg-gray-50" style={{ minHeight: rowHeight }} />
        ))}
        {placed.map(({ reservation, placement, vessel }, index) => (
          <div
            key={reservation.id}
            className="pointer-events-none absolute right-0 left-0"
            style={{ top: 4 + index * laneHeight, height: 36 }}
          >
            <div className="pointer-events-auto relative h-full">
              <BookingBar
                reservation={reservation}
                vesselName={vessel?.name ?? reservation.vesselId}
                berthKind="dry_storage"
                storageStatus={vessel?.storageStatus ?? "launched"}
                selected={selectedReservationId === reservation.id}
                startOffset={placement.startOffset}
                span={placement.span}
                onSelect={onSelect}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
