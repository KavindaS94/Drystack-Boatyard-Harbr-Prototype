import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { conflictDetailsForBerth, datesOverlap } from "../../lib/availability";
import { useMarina, type SendToYardInput } from "../../store/marina-store";
import type { Berth, Reservation } from "../../types/domain";
import { ConflictModal } from "./conflict-modal";

interface SendToYardModalProps {
  reservationId: string;
  boatyardLabel: string;
  onClose: () => void;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

function firstFreeYardBerth(
  berths: Berth[],
  reservations: Reservation[],
  start: string,
  end: string
): string {
  const live = reservations.filter((item) => item.status !== "archived");
  const unused = berths.find((berth) => !live.some((item) => item.berthId === berth.id));
  if (unused) return unused.id;
  const freeForDates = berths.find(
    (berth) =>
      !live.some(
        (item) =>
          item.berthId === berth.id && datesOverlap(item.startDate, item.endDate, start, end)
      )
  );
  return freeForDates?.id ?? berths[0]?.id ?? "";
}

export function SendToYardModal({ reservationId, boatyardLabel, onClose }: SendToYardModalProps) {
  const { state, sendToYard } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const vessel = state.vessels.find((item) => item.id === reservation?.vesselId);
  const yardBerths = useMemo(
    () => state.berths.filter((berth) => berth.kind === "boatyard"),
    [state.berths]
  );
  const jobTypes = useMemo(() => state.jobTypes.filter((item) => item.active), [state.jobTypes]);

  const preferredType = jobTypes.find((item) => item.requiresTc) ?? jobTypes[0];
  const initialStart = reservation?.startDate ?? state.selectedDate;
  const initialEnd = addDays(initialStart, Math.max(preferredType?.defaultDurationDays ?? 1, 1) - 1);

  const [yardBerthId, setYardBerthId] = useState(() =>
    firstFreeYardBerth(yardBerths, state.reservations, initialStart, initialEnd)
  );
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [jobTypeId, setJobTypeId] = useState(preferredType?.id ?? "");
  const [liftTime, setLiftTime] = useState("09:00");
  const [mode, setMode] = useState<SendToYardInput["mode"]>("keep_wet");
  const [conflict, setConflict] = useState<ReturnType<typeof conflictDetailsForBerth>>(null);

  const yardBerth = yardBerths.find((berth) => berth.id === yardBerthId);
  const jobType = jobTypes.find((item) => item.id === jobTypeId);
  const isTooLong = Boolean(vessel && yardBerth && vessel.lengthM > yardBerth.lengthM);
  const canConfirm = Boolean(reservation && yardBerth && jobType && start && end && start <= end);

  function occupancyLabel(berthId: string): string {
    const taken = conflictDetailsForBerth(
      state.reservations,
      state.berths,
      berthId,
      start,
      end,
      reservationId
    );
    return taken ? " — unavailable" : "";
  }

  function onJobTypeChange(nextId: string) {
    setJobTypeId(nextId);
    const duration = jobTypes.find((item) => item.id === nextId)?.defaultDurationDays ?? 1;
    setEnd(addDays(start, Math.max(duration, 1) - 1));
  }

  function onConfirm() {
    if (!canConfirm) return;
    const nextConflict = conflictDetailsForBerth(
      state.reservations,
      state.berths,
      yardBerthId,
      start,
      end,
      reservationId
    );
    if (nextConflict) {
      setConflict(nextConflict);
      return;
    }
    sendToYard({ wetReservationId: reservationId, yardBerthId, start, end, jobTypeId, liftTime, mode });
    toast.success(`Sent to ${boatyardLabel}`);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-to-yard-title"
        data-send-to-yard-modal
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="send-to-yard-title" className="text-sm font-semibold text-neutral-900">
            Send to {boatyardLabel}
          </h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Yard berth</span>
            <select
              value={yardBerthId}
              onChange={(event) => setYardBerthId(event.target.value)}
              data-yard-berth-select
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {yardBerths.map((berth) => (
                <option key={berth.id} value={berth.id}>
                  {berth.name} · {berth.lengthM} m{occupancyLabel(berth.id)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">Start</span>
              <input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">End</span>
              <input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Job type</span>
            <select
              value={jobTypeId}
              onChange={(event) => onJobTypeChange(event.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {jobTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Lift time</span>
            <input
              type="time"
              value={liftTime}
              onChange={(event) => setLiftTime(event.target.value)}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-neutral-500">Berth</legend>
            <label className="flex items-start gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="send-to-yard-mode"
                value="keep_wet"
                checked={mode === "keep_wet"}
                onChange={() => setMode("keep_wet")}
                className="mt-0.5"
              />
              <span className="font-medium">Keep berth</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="send-to-yard-mode"
                value="move"
                checked={mode === "move"}
                onChange={() => setMode("move")}
                className="mt-0.5"
              />
              <span className="font-medium">Move (free berth)</span>
            </label>
          </fieldset>

          {isTooLong && yardBerth && vessel ? (
            <p
              data-length-warning
              className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900"
            >
              Vessel length ({vessel.lengthM} m) is greater than this yard berth ({yardBerth.lengthM} m).
            </p>
          ) : null}
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
            disabled={!canConfirm}
            onClick={onConfirm}
            className="flex-1 rounded-md bg-[hsl(252,75%,70%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(252,75%,60%)] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Confirm
          </button>
        </div>
      </div>
      {conflict ? (
        <ConflictModal
          conflict={conflict}
          onClose={() => setConflict(null)}
          onViewCalendar={() => {
            setConflict(null);
            onClose();
          }}
        />
      ) : null}
    </div>,
    document.body
  );
}
