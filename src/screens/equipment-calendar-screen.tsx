import { useMemo } from "react";
import { Input } from "../components/ui/input";
import { buildDaySlots, slotEnd } from "../lib/equipment";
import { usesForkLift, usesTravelLift } from "../lib/modules";
import { useMarina } from "../store/marina-store";
import type { EquipmentKind } from "../types/domain";

interface EquipmentCalendarScreenProps {
  kind: EquipmentKind;
  embedded?: boolean;
  onFreeSlot?: (time: string) => void;
  onBookedReservation?: (reservationId: string) => void;
}

export function EquipmentCalendarScreen({
  kind,
  embedded = false,
  onFreeSlot,
  onBookedReservation,
}: EquipmentCalendarScreenProps) {
  const { state, setSelectedDate } = useMarina();
  const machine = state.equipment.find((item) => item.kind === kind && item.active) ?? state.equipment.find((item) => item.kind === kind);
  const slots = machine ? buildDaySlots(machine) : [];
  const bookings = useMemo(
    () =>
      state.equipmentBookings.filter(
        (item) => item.equipmentId === machine?.id && item.date === state.selectedDate
      ),
    [machine?.id, state.equipmentBookings, state.selectedDate]
  );

  const enabled = kind === "travel_lift" ? usesTravelLift(state.settings) : usesForkLift(state.settings);
  if (!enabled) {
    return (
      <div className="p-6 text-sm text-neutral-600">
        {kind === "travel_lift"
          ? "Turn on Boatyard in Settings to use the travel lift calendar."
          : "Turn on Dry stack in Settings to use the fork lift calendar."}
      </div>
    );
  }

  if (!machine) {
    return <div className="p-6 text-sm text-neutral-600">No {kind.replace("_", " ")} configured.</div>;
  }

  return (
    <div className={embedded ? "space-y-4 p-4 sm:p-6" : "mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6"} data-equipment-calendar={kind}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {embedded ? null : <h1 className="text-2xl font-semibold text-neutral-900">{machine.name}</h1>}
          <p className={embedded ? "text-sm text-muted-foreground" : "mt-0.5 text-sm text-muted-foreground"}>
            {machine.slotMinutes} min slots · one vessel per slot · click a free hour to book
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <span className="text-xs font-medium text-neutral-500">Date</span>
          <Input
            type="date"
            value={state.selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-8 w-auto"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {slots.map((slot) => {
          const booking = bookings.find((item) => item.startTime === slot);
          const task = booking ? state.launchTasks.find((item) => item.id === booking.taskId) : undefined;
          const vessel = booking ? state.vessels.find((item) => item.id === booking.vesselId) : undefined;
          const customer = task ? state.customers.find((item) => item.id === task.customerId) : undefined;
          const reservationId =
            task?.reservationId ??
            state.reservations.find(
              (item) => item.vesselId === booking?.vesselId && item.status !== "archived"
            )?.id;
          return (
            <button
              key={slot}
              type="button"
              className="grid w-full grid-cols-[5.5rem_minmax(0,1fr)] border-b border-neutral-100 text-left last:border-b-0 hover:bg-neutral-50"
              data-slot={slot}
              onClick={() => {
                if (vessel && reservationId) onBookedReservation?.(reservationId);
                else if (!vessel) onFreeSlot?.(slot);
              }}
            >
              <div className="border-r border-neutral-100 bg-neutral-50 px-3 py-2 text-xs font-semibold tabular-nums text-neutral-600">
                {slot}
                <span className="mt-0.5 block font-normal text-neutral-400">
                  {slotEnd(slot, machine.slotMinutes)}
                </span>
              </div>
              <div className="px-3 py-2 text-sm">
                {vessel ? (
                  <p className="font-medium text-neutral-900">
                    {vessel.name}
                    <span className="ml-2 font-normal text-neutral-500">
                      {customer?.name} · {task ? state.taskTypes.find((item) => item.id === task.taskTypeId)?.name : ""}
                    </span>
                  </p>
                ) : (
                  <p className="text-neutral-400">Free — book</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
