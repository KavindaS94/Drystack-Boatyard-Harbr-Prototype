import { CalendarGrid } from "../components/calendar/calendar-grid";
import { ReservationPanel } from "../components/reservation-panel/reservation-panel";

export function CalendarScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Calendar</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Water berths. Dry stack, dockyard, and hardstand have their own menus.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <CalendarGrid kinds={["wet"]} />
      </div>

      <ReservationPanel allowedKinds={["wet"]} />
    </div>
  );
}
