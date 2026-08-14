import { CalendarGrid } from "../components/calendar/calendar-grid";
import { KindFilter } from "../components/calendar/kind-filter";
import { ReservationPanel } from "../components/reservation-panel/reservation-panel";

export function CalendarScreen() {
  return (
    <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">Calendar</h1>
          <KindFilter />
        </div>
        <CalendarGrid />
      </div>
      <aside className="sticky top-0 max-h-[calc(100vh-6.5rem)] w-80 shrink-0 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
        <ReservationPanel />
      </aside>
    </div>
  );
}
