import { CalendarGrid } from "../components/calendar/calendar-grid";
import { KindFilter } from "../components/calendar/kind-filter";
import { ReservationPanel } from "../components/reservation-panel/reservation-panel";

export function CalendarScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <KindFilter />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch gap-0 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <CalendarGrid />
        </div>
        <aside className="hidden w-96 shrink-0 overflow-y-auto border-l border-gray-200 bg-white lg:block">
          <ReservationPanel />
        </aside>
      </div>
    </div>
  );
}
