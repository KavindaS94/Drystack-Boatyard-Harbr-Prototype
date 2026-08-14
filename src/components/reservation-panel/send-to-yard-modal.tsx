import { useMemo, useState } from "react";
import { useMarina, type SendToYardInput } from "../../store/marina-store";

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

export function SendToYardModal({ reservationId, boatyardLabel, onClose }: SendToYardModalProps) {
  const { state, sendToYard } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const vessel = state.vessels.find((item) => item.id === reservation?.vesselId);
  const yardBerths = useMemo(
    () => state.berths.filter((berth) => berth.kind === "boatyard"),
    [state.berths]
  );
  const jobTypes = useMemo(() => state.jobTypes.filter((item) => item.active), [state.jobTypes]);

  const [yardBerthId, setYardBerthId] = useState(yardBerths[0]?.id ?? "");
  const [start, setStart] = useState(reservation?.startDate ?? state.selectedDate);
  const [end, setEnd] = useState(reservation?.endDate ?? state.selectedDate);
  const [jobTypeId, setJobTypeId] = useState(jobTypes[0]?.id ?? "");
  const [liftTime, setLiftTime] = useState("");
  const [mode, setMode] = useState<SendToYardInput["mode"]>("keep_wet");

  const yardBerth = yardBerths.find((berth) => berth.id === yardBerthId);
  const jobType = jobTypes.find((item) => item.id === jobTypeId);
  const isTooLong = Boolean(vessel && yardBerth && vessel.lengthM > yardBerth.lengthM);
  const canConfirm = Boolean(reservation && yardBerth && jobType && start && end && start <= end);

  function onJobTypeChange(nextId: string) {
    setJobTypeId(nextId);
    const duration = jobTypes.find((item) => item.id === nextId)?.defaultDurationDays ?? 1;
    setEnd(addDays(start, Math.max(duration, 1) - 1));
  }

  function onConfirm() {
    if (!canConfirm) return;
    sendToYard({ wetReservationId: reservationId, yardBerthId, start, end, jobTypeId, liftTime, mode });
    onClose();
  }

  return (
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
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {yardBerths.map((berth) => (
                <option key={berth.id} value={berth.id}>
                  {berth.name} · {berth.lengthM} m
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
            <legend className="text-xs font-medium text-neutral-500">Wet berth</legend>
            <label className="flex items-start gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="send-to-yard-mode"
                value="keep_wet"
                checked={mode === "keep_wet"}
                onChange={() => setMode("keep_wet")}
                className="mt-0.5"
              />
              <span className="font-medium">Keep wet berth</span>
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
              <span className="font-medium">Move (free wet berth)</span>
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
            className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
