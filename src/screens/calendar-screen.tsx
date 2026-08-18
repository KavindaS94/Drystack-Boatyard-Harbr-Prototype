import { CalendarGrid } from "../components/calendar/calendar-grid";
import { KindFilter } from "../components/calendar/kind-filter";
import { ReservationPanel } from "../components/reservation-panel/reservation-panel";

export function CalendarScreen() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Calendar</h1>
        <KindFilter />
      </div>

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <CalendarGrid />
        </div>
        <aside className="sticky top-0 max-h-[calc(100vh-6.5rem)] w-96 shrink-0 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
          <ReservationPanel />
        </aside>
      </div>
    </div>
  );
}
