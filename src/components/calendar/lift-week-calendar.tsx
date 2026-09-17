import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { equipmentForModule, minutesToTime, snapToSlot, timeToMinutes } from "../../lib/equipment";
import { addDays, toIsoDate, toLocalDate } from "../../lib/iso-date";
import { usesTravelLift } from "../../lib/modules";
import { formatHour, hourLabels, mondayOf, weekdayShort, weekDays, weekTitle, CALENDAR_DAY_START, CALENDAR_DAY_END } from "../../lib/week";
import { useMarina } from "../../store/marina-store";
import { Button } from "../ui/button";
import { calendarEventStyle } from "./event-tone";

const PAD_COLORS = ["#C43148", "#CA5010", "#038387", "#5B5FC7", "#C239B3", "#498205", "#8764B8", "#0078D4"] as const;
const GUTTER = 72;
const HOUR_H = 52;

interface TimedEvent {
  id: string;
  reservationId: string | null;
  date: string;
  label: string;
  sub: string;
  color: string;
  startMin: number;
  endMin: number;
}

interface LiftWeekCalendarProps {
  onFreeSlot?: (date: string, time: string) => void;
  onBookedReservation?: (reservationId: string) => void;
}

export function LiftWeekCalendar({ onFreeSlot, onBookedReservation }: LiftWeekCalendarProps) {
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const [weekStart, setWeekStart] = useState(() => mondayOf(state.selectedDate));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setWeekStart(mondayOf(state.selectedDate));
  }, [state.selectedDate]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const machine = equipmentForModule(state.equipment, "boatyard");
  const pads = useMemo(
    () =>
      state.berths
        .filter((berth) => berth.kind === "boatyard")
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    [state.berths]
  );
  const colorByPad = useMemo(
    () => new Map(pads.map((pad, index) => [pad.id, PAD_COLORS[index % PAD_COLORS.length]])),
    [pads]
  );

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const weekEnd = days[6];
  const todayIso = toIsoDate(now);
  const dayStart = CALENDAR_DAY_START;
  const dayEnd = CALENDAR_DAY_END;
  const hours = useMemo(() => hourLabels(dayStart, dayEnd), [dayStart, dayEnd]);
  const dayStartMin = timeToMinutes(dayStart);
  const dayEndMin = timeToMinutes(dayEnd);
  const slotMinutes = machine?.slotMinutes ?? 60;

  const timed = useMemo(() => {
    if (!machine) return [];
    const events: TimedEvent[] = [];
    const bookings = state.equipmentBookings.filter(
      (item) => item.equipmentId === machine.id && item.date >= weekStart && item.date <= weekEnd
    );
    for (const booking of bookings) {
      const task = state.launchTasks.find((item) => item.id === booking.taskId);
      if (!task || task.status === "declined") continue;
      const startMin = timeToMinutes(booking.startTime);
      if (startMin >= dayEndMin || startMin + 15 <= dayStartMin) continue;
      const vessel = state.vessels.find((item) => item.id === booking.vesselId);
      const type = state.taskTypes.find((item) => item.id === task.taskTypeId);
      const pad = state.berths.find((item) => item.id === task.berthId);
      const reservationId =
        task.reservationId ??
        state.reservations.find((item) => item.vesselId === booking.vesselId && item.status !== "archived")?.id ??
        null;
      events.push({
        id: booking.id,
        reservationId,
        date: booking.date,
        label: `${type?.name ?? "Lift"} · ${vessel?.name ?? "Vessel"}`,
        sub: pad?.name ?? "",
        color: colorByPad.get(task.berthId) ?? PAD_COLORS[0],
        startMin: Math.max(startMin, dayStartMin),
        endMin: Math.min(startMin + slotMinutes, dayEndMin),
      });
    }
    return events;
  }, [
    colorByPad,
    dayEndMin,
    dayStartMin,
    machine,
    slotMinutes,
    state.berths,
    state.equipmentBookings,
    state.launchTasks,
    state.reservations,
    state.taskTypes,
    state.vessels,
    weekEnd,
    weekStart,
  ]);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = days.includes(todayIso) && nowMin >= dayStartMin && nowMin <= dayEndMin;
  const nowTop = ((nowMin - dayStartMin) / 60) * HOUR_H;
  const todayIdx = days.indexOf(todayIso);

  function openSlot(date: string, clientY: number, columnTop: number) {
    if (!machine) return;
    const minutes = dayStartMin + ((clientY - columnTop) / HOUR_H) * 60;
    const snapped = snapToSlot(
      minutesToTime(Math.max(dayStartMin, Math.min(minutes, dayEndMin - slotMinutes))),
      machine
    );
    if (!snapped) return;
    setSelectedDate(date);
    onFreeSlot?.(date, snapped);
  }

  if (!usesTravelLift(state.settings)) {
    return <div className="p-6 text-sm text-neutral-600">Turn on Boatyard in Settings to use the travel lift calendar.</div>;
  }

  if (!machine) {
    return <div className="p-6 text-sm text-neutral-600">No travel lift configured.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]" data-equipment-calendar="travel_lift" data-lift-week-calendar>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(mondayOf(todayIso))}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
            <ChevronLeftIcon />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
            <ChevronRightIcon />
          </Button>
          <h2 className="text-lg font-semibold text-neutral-900">{weekTitle(weekStart)}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-neutral-500 lg:block">
            {machine.name} · {slotMinutes} min slots · click a free hour to book
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[720px]">
          <div
            className="sticky top-0 z-20 grid border-b border-neutral-200 bg-white"
            style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
          >
            <div />
            {days.map((iso) => {
              const date = toLocalDate(iso);
              const isToday = iso === todayIso;
              return (
                <div key={iso} className={`border-l border-neutral-100 py-2 text-center ${isToday ? "bg-[hsl(252,75%,99%)]" : ""}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{weekdayShort(iso)}</p>
                  <p
                    className={`mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full text-lg font-semibold ${
                      isToday ? "bg-[hsl(252,75%,70%)] text-white" : "text-neutral-900"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative" style={{ height: hours.length * HOUR_H }}>
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}>
              <div className="relative bg-[#f8f9fb]">
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute right-2 text-[11px] tabular-nums text-neutral-400"
                    style={{ top: index * HOUR_H - 7 }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
                <div
                  className="absolute right-2 text-[11px] tabular-nums text-neutral-400"
                  style={{ top: hours.length * HOUR_H - 7 }}
                >
                  {formatHour(dayEnd)}
                </div>
              </div>
              {days.map((iso, dayIndex) => (
                <DayColumn
                  key={iso}
                  iso={iso}
                  isToday={iso === todayIso}
                  hours={hours}
                  events={timed.filter((event) => event.date === iso)}
                  selectedId={state.selectedReservationId}
                  nowTop={showNow && dayIndex === todayIdx ? nowTop : null}
                  onSelect={(reservationId) => {
                    setSelectedReservationId(reservationId);
                    onBookedReservation?.(reservationId);
                  }}
                  onEmpty={(clientY, top) => openSlot(iso, clientY, top)}
                />
              ))}
            </div>
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="pointer-events-none absolute right-0 left-[72px] border-t border-neutral-100"
                style={{ top: index * HOUR_H }}
              />
            ))}
            <div
              className="pointer-events-none absolute right-0 left-[72px] border-t border-neutral-100"
              style={{ top: hours.length * HOUR_H }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  iso,
  isToday,
  hours,
  events,
  selectedId,
  nowTop,
  onSelect,
  onEmpty,
}: {
  iso: string;
  isToday: boolean;
  hours: string[];
  events: TimedEvent[];
  selectedId: string | null;
  nowTop: number | null;
  onSelect: (id: string) => void;
  onEmpty: (clientY: number, top: number) => void;
}) {
  return (
    <div className={`relative border-l border-neutral-100 ${isToday ? "bg-[hsl(252,75%,99%)]" : "bg-white"}`}>
      <button
        type="button"
        className="absolute inset-0"
        aria-label={`Book ${iso}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onEmpty(event.clientY, rect.top);
        }}
      />
      {events.map((event) => {
        const top = ((event.startMin - timeToMinutes(hours[0])) / 60) * HOUR_H;
        const height = Math.max(((event.endMin - event.startMin) / 60) * HOUR_H - 2, 28);
        const overlap = events.filter((other) => other.startMin < event.endMin && event.startMin < other.endMin);
        const col = overlap.findIndex((other) => other.id === event.id);
        const cols = Math.max(overlap.length, 1);
        return (
          <button
            key={event.id}
            type="button"
            onClick={(click) => {
              click.stopPropagation();
              if (event.reservationId) onSelect(event.reservationId);
            }}
            className="absolute z-10 overflow-hidden rounded-sm px-1.5 py-0.5 text-left text-[11px] leading-tight text-neutral-900"
            style={{
              top,
              height,
              left: `calc(${(col / cols) * 100}% + 3px)`,
              width: `calc(${100 / cols}% - 6px)`,
              ...calendarEventStyle(event.color, Boolean(event.reservationId && selectedId === event.reservationId)),
            }}
          >
            <span className="block truncate font-semibold">{event.label}</span>
            <span className="block truncate text-neutral-800">{event.sub}</span>
          </button>
        );
      })}
      {nowTop != null ? (
        <div className="pointer-events-none absolute right-0 left-0 z-20" style={{ top: nowTop }}>
          <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-red-500" />
          <div className="h-px bg-red-500" />
        </div>
      ) : null}
    </div>
  );
}
