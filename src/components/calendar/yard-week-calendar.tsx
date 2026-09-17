import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { equipmentForModule, minutesToTime, snapToSlot, timeToMinutes } from "../../lib/equipment";
import { addDays, toIsoDate, toLocalDate } from "../../lib/iso-date";
import {
  CALENDAR_DAY_END,
  CALENDAR_DAY_START,
  formatHour,
  hourLabels,
  mondayOf,
  weekdayShort,
  weekDays,
  weekTitle,
} from "../../lib/week";
import { useMarina } from "../../store/marina-store";
import { PlaceBookingModal } from "../reservation-panel/place-booking-modal";
import { Button } from "../ui/button";
import { CalendarGrid } from "./calendar-grid";
import { calendarEventStyle } from "./event-tone";

const YARD_COLORS = ["#5B5FC7", "#038387", "#C239B3", "#CA5010", "#0078D4", "#498205", "#8764B8", "#C43148"] as const;

const GUTTER = 72;
const HOUR_H = 52;

interface TimedEvent {
  id: string;
  reservationId: string;
  berthId: string;
  date: string;
  label: string;
  sub: string;
  color: string;
  startMin: number;
  endMin: number;
}

export function YardWeekCalendar() {
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const [view, setView] = useState<"week" | "occupancy">("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(state.selectedDate));
  const [now, setNow] = useState(() => new Date());
  const [addTarget, setAddTarget] = useState<{ berthId: string; start: string } | null>(null);

  const pads = useMemo(
    () =>
      state.berths
        .filter((berth) => berth.kind === "boatyard")
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    [state.berths]
  );
  const colorByPad = useMemo(
    () => new Map(pads.map((pad, index) => [pad.id, YARD_COLORS[index % YARD_COLORS.length]])),
    [pads]
  );

  const [visibleIds, setVisibleIds] = useState<string[]>(() => pads.map((pad) => pad.id));
  const [focusPadId, setFocusPadId] = useState(pads[0]?.id ?? "");

  useEffect(() => {
    setWeekStart(mondayOf(state.selectedDate));
  }, [state.selectedDate]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const weekEnd = days[6];
  const todayIso = toIsoDate(now);
  const machine = equipmentForModule(state.equipment, "boatyard");
  const dayStart = CALENDAR_DAY_START;
  const dayEnd = CALENDAR_DAY_END;
  const hours = useMemo(() => hourLabels(dayStart, dayEnd), [dayStart, dayEnd]);
  const dayStartMin = timeToMinutes(dayStart);
  const dayEndMin = timeToMinutes(dayEnd);
  const slotMinutes = machine?.slotMinutes ?? 60;

  const visiblePads = pads.filter((pad) => visibleIds.includes(pad.id));
  const focusedPad = pads.find((pad) => pad.id === focusPadId) ?? visiblePads[0] ?? pads[0];

  const liveJobs = useMemo(
    () =>
      state.reservations.filter(
        (item) =>
          item.status !== "archived" &&
          item.job &&
          visibleIds.includes(item.berthId) &&
          item.startDate >= weekStart &&
          item.startDate <= weekEnd
      ),
    [state.reservations, visibleIds, weekEnd, weekStart]
  );

  const timed = useMemo(() => {
    return liveJobs.flatMap((reservation) => {
      const job = reservation.job;
      if (!job) return [];
      const date = reservation.startDate;
      const liftTime = job.liftTime ?? "08:00";
      const sameDayLaunch = (job.launchDate ?? reservation.endDate) === date && job.launchTime;
      const launchTime = sameDayLaunch && job.launchTime ? job.launchTime : minutesToTime(dayEndMin);
      const startMin = Math.max(timeToMinutes(liftTime), dayStartMin);
      const rawEnd = timeToMinutes(launchTime);
      const endMin = Math.min(Math.max(rawEnd, startMin + 60), dayEndMin);
      if (startMin >= dayEndMin) return [];
      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
      const jobType = state.jobTypes.find((item) => item.id === job.typeId);
      const pad = pads.find((item) => item.id === reservation.berthId);
      return [
        {
          id: reservation.id,
          reservationId: reservation.id,
          berthId: reservation.berthId,
          date,
          label: `${jobType?.name ?? "Job"} · ${vessel?.name ?? "Vessel"}`,
          sub: `${pad?.name ?? ""} · ${liftTime}–${launchTime}`,
          color: jobType?.colour ?? colorByPad.get(reservation.berthId) ?? YARD_COLORS[0],
          startMin,
          endMin,
        },
      ];
    });
  }, [colorByPad, dayEndMin, dayStartMin, liveJobs, pads, state.jobTypes, state.vessels]);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = days.includes(todayIso) && nowMin >= dayStartMin && nowMin <= dayEndMin;
  const nowTop = ((nowMin - dayStartMin) / 60) * HOUR_H;
  const todayIdx = days.indexOf(todayIso);

  function togglePad(id: string) {
    setVisibleIds((current) => {
      if (current.includes(id)) {
        const next = current.filter((item) => item !== id);
        return next.length ? next : current;
      }
      return [...current, id];
    });
    setFocusPadId(id);
  }

  function isolatePad(id: string) {
    const onlyThis = visibleIds.length === 1 && visibleIds[0] === id;
    setVisibleIds(onlyThis ? pads.map((pad) => pad.id) : [id]);
    setFocusPadId(id);
  }

  function openBooking(date: string, clientY?: number, columnTop?: number) {
    if (!focusedPad) return;
    setSelectedDate(date);
    if (clientY != null && columnTop != null && machine) {
      const minutes = dayStartMin + ((clientY - columnTop) / HOUR_H) * 60;
      const snapped = snapToSlot(minutesToTime(Math.max(dayStartMin, Math.min(minutes, dayEndMin - slotMinutes))), machine);
      if (snapped) setSelectedDate(date);
    }
    setAddTarget({ berthId: focusedPad.id, start: date });
  }

  if (view === "occupancy") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2">
          <p className="text-sm text-neutral-600">Pad occupancy across the week</p>
          <ViewToggle view={view} onChange={setView} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <CalendarGrid kinds={["boatyard"]} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-[#f8f9fb]" data-yard-week-calendar>
      <aside className="flex h-full min-h-0 w-52 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
        <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">My yards</p>
            <div className="flex gap-2">
              <button type="button" className="text-[11px] text-neutral-500 hover:text-neutral-800" onClick={() => setVisibleIds(pads.map((pad) => pad.id))}>
                All
              </button>
              <button type="button" className="text-[11px] text-neutral-500 hover:text-neutral-800" onClick={() => focusedPad && setVisibleIds([focusedPad.id])}>
                This yard
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
          {pads.map((pad) => {
            const on = visibleIds.includes(pad.id);
            const color = colorByPad.get(pad.id) ?? YARD_COLORS[0];
            const focused = pad.id === focusedPad?.id;
            return (
              <div
                key={pad.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1 ${focused ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => togglePad(pad.id)}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm border"
                  style={{
                    backgroundColor: on ? color : "white",
                    borderColor: color,
                  }}
                >
                  {on ? <span className="block size-2 rounded-[1px] bg-white/90" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => isolatePad(pad.id)}
                  className="min-w-0 flex-1 text-left text-sm font-medium text-neutral-800"
                >
                  {pad.name}
                  <span className="ml-1 font-normal text-neutral-400">{pad.lengthM}m</span>
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
              {visiblePads.length === 1 ? `${visiblePads[0].name} calendar` : `${visiblePads.length} yards`}
            </p>
            <ViewToggle view={view} onChange={setView} />
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
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {weekdayShort(iso)}
                    </p>
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
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
              >
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
                    onSelect={setSelectedReservationId}
                    onEmpty={(clientY, top) => openBooking(iso, clientY, top)}
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

      {addTarget ? (
        <PlaceBookingModal
          title={`Place in ${focusedPad?.name ?? "yard"}`}
          destKind="boatyard"
          destBerthId={addTarget.berthId}
          startDate={addTarget.start}
          onClose={() => setAddTarget(null)}
        />
      ) : null}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: "week" | "occupancy"; onChange: (view: "week" | "occupancy") => void }) {
  return (
    <div className="inline-flex rounded-md border border-neutral-200 p-0.5">
      <button
        type="button"
        onClick={() => onChange("week")}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
          view === "week" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        <CalendarDaysIcon className="size-3.5" />
        Week
      </button>
      <button
        type="button"
        onClick={() => onChange("occupancy")}
        className={`rounded px-2 py-1 text-xs font-medium ${
          view === "occupancy" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        Occupancy
      </button>
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
        const height = Math.max(((event.endMin - event.startMin) / 60) * HOUR_H - 2, 22);
        const overlap = events.filter(
          (other) => other.startMin < event.endMin && event.startMin < other.endMin
        );
        const col = overlap.findIndex((other) => other.id === event.id);
        const cols = Math.max(overlap.length, 1);
        return (
          <button
            key={event.id}
            type="button"
            onClick={(click) => {
              click.stopPropagation();
              onSelect(event.reservationId);
            }}
            className="absolute z-10 overflow-hidden rounded-sm px-1.5 py-0.5 text-left text-[11px] leading-tight text-neutral-900"
            style={{
              top,
              height,
              left: `calc(${(col / cols) * 100}% + 3px)`,
              width: `calc(${100 / cols}% - 6px)`,
              ...calendarEventStyle(event.color, selectedId === event.reservationId),
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
