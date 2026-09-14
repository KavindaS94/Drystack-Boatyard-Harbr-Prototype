import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { buildDaySlots, equipmentForModule } from "../../lib/equipment";
import { moduleLabel } from "../../lib/modules";
import { conflictDetailsForEquipment } from "../../lib/equipment";
import { useMarina } from "../../store/marina-store";
import type { Berth, Customer, Reservation, TaskModule, Vessel } from "../../types/domain";
import { EquipmentConflictModal } from "../reservation-panel/equipment-conflict-modal";

interface AddTaskModalProps {
  date: string;
  module: TaskModule;
  asRequest?: boolean;
  initialTime?: string;
  onClose: () => void;
}

interface ModuleClient {
  customer: Customer;
  vessel: Vessel;
  berth: Berth;
  reservation: Reservation;
}

function coversDate(reservation: Reservation, date: string): boolean {
  return reservation.startDate <= date && reservation.endDate >= date;
}

export function AddTaskModal({ date, module, asRequest = false, initialTime, onClose }: AddTaskModalProps) {
  const { state, addLaunchTask } = useMarina();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const types = state.taskTypes.filter((item) => {
    if (!item.active) return false;
    if (module === "other") return item.kind === "other" || item.module === "other";
    return item.module === module;
  });
  const [taskTypeId, setTaskTypeId] = useState(() => types.find((item) => item.kind === "launch")?.id ?? types[0]?.id ?? "");
  const machine = equipmentForModule(state.equipment, module);
  const slots = machine ? buildDaySlots(machine) : [];
  const [time, setTime] = useState(initialTime ?? slots[4] ?? slots[0] ?? "09:00");
  const [equipmentConflict, setEquipmentConflict] = useState<ReturnType<typeof conflictDetailsForEquipment>>(null);

  const clients = useMemo<ModuleClient[]>(() => {
    const seen = new Set<string>();
    const out: ModuleClient[] = [];

    function consider(reservation: Reservation) {
      if (reservation.status === "archived") return;
      if (seen.has(reservation.vesselId)) return;
      const customer = state.customers.find((item) => item.id === reservation.customerId);
      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
      const berth = state.berths.find((item) => item.id === reservation.berthId);
      if (!customer || !vessel || !berth) return;
      seen.add(reservation.vesselId);
      out.push({ customer, vessel, berth, reservation });
    }

    for (const reservation of state.reservations) {
      if (reservation.status === "archived") continue;
      const berth = state.berths.find((item) => item.id === reservation.berthId);
      if (!berth) continue;
      if (module === "other") {
        if (coversDate(reservation, date)) consider(reservation);
        continue;
      }
      if (berth.kind === module) {
        if (module === "boatyard" || coversDate(reservation, date)) consider(reservation);
      }
    }
    if (module !== "other") {
      for (const reservation of state.reservations) {
        if (reservation.status === "archived" || !coversDate(reservation, date)) continue;
        const berth = state.berths.find((item) => item.id === reservation.berthId);
        if (berth?.kind === "wet") consider(reservation);
      }
    }
    return out;
  }, [date, module, state.berths, state.customers, state.reservations, state.vessels]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (item) =>
        item.customer.name.toLowerCase().includes(q) || item.vessel.name.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const selected = clients.find((item) => item.reservation.id === selectedKey) ?? null;
  const canSave = Boolean(selected && taskTypeId && time);

  function onSave() {
    if (!selected || !taskTypeId || !time) return;
    const taskType = state.taskTypes.find((item) => item.id === taskTypeId);
    if (taskType) {
      const conflict = conflictDetailsForEquipment(
        state.equipmentBookings,
        state.equipment,
        taskType.module,
        date,
        time
      );
      if (conflict) {
        setEquipmentConflict(conflict);
        return;
      }
    }
    const ok = addLaunchTask({
      taskTypeId,
      customerId: selected.customer.id,
      vesselId: selected.vessel.id,
      berthId: selected.berth.id,
      date,
      time,
      reservationId: selected.reservation.id,
      asRequest,
      source: asRequest ? "customer" : "staff",
    });
    if (!ok) {
      toast.error("That lift slot is already taken");
      return;
    }
    toast.success(asRequest ? "Request logged — customer emailed" : "Task booked — customer emailed");
    onClose();
  }

  const title = asRequest ? "Log request" : "Add task";
  const label = moduleLabel(module, state.settings);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        data-add-task-modal
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="add-task-title" className="text-sm font-semibold text-neutral-900">
            {title} · {label}
          </h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Search customer</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedKey(null);
              }}
              placeholder={`Customer with ${label.toLowerCase()} reservation`}
              data-add-task-search
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
          </label>

          <ul className="max-h-40 overflow-y-auto rounded-md border border-neutral-200" data-add-task-results>
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-500">No matching customers.</li>
            ) : (
              matches.map((item) => (
                <li key={item.reservation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(item.reservation.id)}
                    data-customer-name={item.customer.name}
                    data-vessel-name={item.vessel.name}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                      selectedKey === item.reservation.id ? "bg-neutral-100" : ""
                    }`}
                  >
                    <span className="font-medium text-neutral-900">{item.customer.name}</span>
                    <span className="text-xs text-neutral-500">
                      {item.vessel.name} · {item.berth.name}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Task type</span>
            <select
              value={taskTypeId}
              onChange={(event) => setTaskTypeId(event.target.value)}
              data-add-task-type
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {types.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">
              Time {machine ? `(${machine.name}, ${machine.slotMinutes} min slots)` : ""}
            </span>
            {slots.length > 0 ? (
              <select
                value={time}
                onChange={(event) => setTime(event.target.value)}
                data-add-task-time
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
              >
                {slots.map((slot) => {
                  const taken = state.equipmentBookings.some(
                    (booking) =>
                      booking.equipmentId === machine?.id &&
                      booking.date === date &&
                      booking.startTime === slot
                  );
                  return (
                    <option key={slot} value={slot} disabled={taken}>
                      {slot}
                      {taken ? " — taken" : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                data-add-task-time
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            )}
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={onSave}
            data-add-task-save
            className="flex-1 rounded-md bg-[hsl(252,75%,70%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(252,75%,60%)] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Save
          </button>
        </div>
      </div>
      {equipmentConflict ? (
        <EquipmentConflictModal conflict={equipmentConflict} onClose={() => setEquipmentConflict(null)} />
      ) : null}
    </div>,
    document.body
  );
}
