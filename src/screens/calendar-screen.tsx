import { CalendarGrid } from "../components/calendar/calendar-grid";
import { KindFilter } from "../components/calendar/kind-filter";
import { useMarina } from "../store/marina-store";

export function CalendarScreen() {
  const { state } = useMarina();

  return (
    <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">Calendar</h1>
          <KindFilter />
        </div>
        <CalendarGrid />
      </div>
      <aside className="sticky top-0 w-72 shrink-0 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Reservation</p>
        {state.selectedReservationId ? (
          <p className="mt-2 text-sm text-neutral-900">Selected: {state.selectedReservationId}</p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">Click a booking bar</p>
        )}
      </aside>
    </div>
  );
}
