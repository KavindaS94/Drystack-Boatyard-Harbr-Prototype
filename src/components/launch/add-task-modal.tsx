import { useMemo, useState } from "react";
import { useMarina } from "../../store/marina-store";
import type { Berth, Customer, Reservation, Vessel } from "../../types/domain";

interface AddTaskModalProps {
  date: string;
  onClose: () => void;
}

interface DryStorageClient {
  customer: Customer;
  vessel: Vessel;
  berth: Berth;
  reservation: Reservation;
}

function coversDate(reservation: Reservation, date: string): boolean {
  return reservation.startDate <= date && reservation.endDate >= date;
}

export function AddTaskModal({ date, onClose }: AddTaskModalProps) {
  const { state, addLaunchTask } = useMarina();
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [taskTypeId, setTaskTypeId] = useState(
    () => state.taskTypes.find((item) => item.active && item.kind === "launch")?.id ?? ""
  );
  const [time, setTime] = useState("09:00");

  const dryClients = useMemo<DryStorageClient[]>(() => {
    const dryBerthIds = new Set(
      state.berths.filter((berth) => berth.kind === "dry_storage").map((berth) => berth.id)
    );
    return state.reservations.flatMap((reservation) => {
      if (!dryBerthIds.has(reservation.berthId) || !coversDate(reservation, date)) return [];
      const customer = state.customers.find((item) => item.id === reservation.customerId);
      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
      const berth = state.berths.find((item) => item.id === reservation.berthId);
      if (!customer || !vessel || !berth) return [];
      return [{ customer, vessel, berth, reservation }];
    });
  }, [date, state.berths, state.customers, state.reservations, state.vessels]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dryClients;
    return dryClients.filter(
      (item) =>
        item.customer.name.toLowerCase().includes(q) || item.vessel.name.toLowerCase().includes(q)
    );
  }, [dryClients, query]);

  const selected = dryClients.find((item) => item.customer.id === selectedCustomerId) ?? null;
  const activeTypes = state.taskTypes.filter((item) => item.active);
  const canSave = Boolean(selected && taskTypeId && time);

  function onSave() {
    if (!selected || !taskTypeId || !time) return;
    addLaunchTask({
      taskTypeId,
      customerId: selected.customer.id,
      vesselId: selected.vessel.id,
      berthId: selected.berth.id,
      date,
      time,
    });
    onClose();
  }

  return (
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
            Add task
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
                setSelectedCustomerId(null);
              }}
              placeholder="Customer with dry-storage reservation"
              data-add-task-search
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
          </label>

          <ul className="max-h-40 overflow-y-auto rounded-md border border-neutral-200" data-add-task-results>
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-500">No dry-storage customers match.</li>
            ) : (
              matches.map((item) => (
                <li key={item.reservation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(item.customer.id)}
                    data-customer-name={item.customer.name}
                    data-vessel-name={item.vessel.name}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                      selectedCustomerId === item.customer.id ? "bg-neutral-100" : ""
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

          {selected ? (
            <p className="text-xs text-neutral-600" data-add-task-prefill>
              {selected.vessel.name} · {selected.berth.name}
            </p>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Task type</span>
            <select
              value={taskTypeId}
              onChange={(event) => setTaskTypeId(event.target.value)}
              data-add-task-type
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {activeTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Time</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              data-add-task-time
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
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
            className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
