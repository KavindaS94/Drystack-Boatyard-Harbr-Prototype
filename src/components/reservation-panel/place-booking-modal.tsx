import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { conflictDetailsForBerth, hasLiveWetReservation, sourceReservationForVessel } from "../../lib/availability";
import { buildDaySlots, conflictDetailsForEquipment, equipmentForModule } from "../../lib/equipment";
import { addDays } from "../../lib/iso-date";
import { kindLabel } from "../../lib/labels";
import { workJobTypes } from "../../lib/job-types";
import { isKindEnabled, isLandKind, modulePath, spaceKindToModule } from "../../lib/modules";
import { useMarina, type PlaceBookingInput } from "../../store/marina-store";
import type { Berth, Reservation, SpaceKind } from "../../types/domain";
import { Button } from "../ui/button";
import { ConflictModal } from "./conflict-modal";
import { EquipmentConflictModal } from "./equipment-conflict-modal";

export interface PlaceBookingModalProps {
  title: string;
  onClose: () => void;
  destBerthId?: string;
  sourceReservationId?: string;
  destKind?: SpaceKind;
  startDate?: string;
}

function firstFreeBerth(berths: Berth[], reservations: Reservation[], start: string, end: string): string {
  const unused = berths.find(
    (berth) => !reservations.some((item) => item.status !== "archived" && item.berthId === berth.id)
  );
  if (unused) return unused.id;
  const freeForDates = berths.find(
    (berth) => !conflictDetailsForBerth(reservations, berths, berth.id, start, end)
  );
  return freeForDates?.id ?? berths[0]?.id ?? "";
}

function keepFreeLabels(
  sourceKind: SpaceKind | undefined,
  settings: { boatyardLabel: string; dryStorageLabel: string; hardstandLabel: string }
): { keep: string; move: string; legend: string } {
  if (sourceKind === "wet") {
    return {
      legend: "Berth",
      keep: "Keep berth",
      move: "Move (free berth)",
    };
  }
  if (sourceKind === "dry_storage") {
    return {
      legend: settings.dryStorageLabel,
      keep: `Keep ${settings.dryStorageLabel.toLowerCase()} rack`,
      move: `Move (free ${settings.dryStorageLabel.toLowerCase()} rack)`,
    };
  }
  if (sourceKind === "hardstand") {
    return {
      legend: settings.hardstandLabel,
      keep: `Keep ${settings.hardstandLabel.toLowerCase()} pad`,
      move: `Move (free ${settings.hardstandLabel.toLowerCase()} pad)`,
    };
  }
  if (sourceKind === "boatyard") {
    return {
      legend: settings.boatyardLabel,
      keep: `Keep ${settings.boatyardLabel.toLowerCase()} pad`,
      move: `Move (free ${settings.boatyardLabel.toLowerCase()} pad)`,
    };
  }
  return { legend: "Current space", keep: "Keep previous space", move: "Move (free previous space)" };
}

export function PlaceBookingModal({
  title,
  onClose,
  destBerthId,
  sourceReservationId,
  destKind,
  startDate,
}: PlaceBookingModalProps) {
  const navigate = useNavigate();
  const { state, placeBooking } = useMarina();
  const sourceReservation = sourceReservationId
    ? state.reservations.find((item) => item.id === sourceReservationId)
    : undefined;
  const lockedVesselId = sourceReservation?.vesselId;
  const sourceKind = sourceReservation
    ? state.berths.find((item) => item.id === sourceReservation.berthId)?.kind
    : undefined;
  const destBerths = useMemo(() => {
    return state.berths.filter((berth) => {
      if (destBerthId) return berth.id === destBerthId;
      if (sourceKind === "wet" && isLandKind(berth.kind)) return false;
      if (destKind && berth.kind !== destKind) return false;
      return isKindEnabled(berth.kind, state.settings);
    });
  }, [destBerthId, destKind, sourceKind, state.berths, state.settings]);

  const jobTypes = useMemo(
    () => workJobTypes(state.jobTypes).filter((item) => item.active),
    [state.jobTypes]
  );
  const preferredType = jobTypes.find((item) => item.id === "jt-antifoul") ?? jobTypes[0];
  const initialStart = startDate ?? sourceReservation?.startDate ?? state.selectedDate;
  const initialDestId =
    destBerthId ?? firstFreeBerth(destBerths, state.reservations, initialStart, addDays(initialStart, 6));
  const initialDest = state.berths.find((item) => item.id === initialDestId);

  const [vesselId, setVesselId] = useState(
    lockedVesselId ?? state.vessels.find((item) => item.name === "Gannet")?.id ?? state.vessels[0]?.id ?? ""
  );
  const [berthId, setBerthId] = useState(initialDestId);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(() => {
    if (sourceReservation && !startDate) return sourceReservation.endDate;
    const duration = initialDest?.kind === "boatyard" ? Math.max(preferredType?.defaultDurationDays ?? 1, 1) : 7;
    return addDays(initialStart, duration - 1);
  });
  const [jobTypeId, setJobTypeId] = useState(preferredType?.id ?? "");
  const [liftTime, setLiftTime] = useState("09:00");
  const [mode, setMode] = useState<PlaceBookingInput["mode"]>("keep");
  const [conflict, setConflict] = useState<ReturnType<typeof conflictDetailsForBerth>>(null);
  const [equipmentConflict, setEquipmentConflict] = useState<ReturnType<typeof conflictDetailsForEquipment>>(null);

  const dest = state.berths.find((item) => item.id === berthId);
  const bookableVessels = useMemo(() => {
    if (!dest || dest.kind === "wet") return state.vessels;
    return state.vessels.filter(
      (item) => !hasLiveWetReservation(state.reservations, state.berths, item.id)
    );
  }, [dest, state.berths, state.reservations, state.vessels]);
  const vessel = state.vessels.find((item) => item.id === vesselId);

  useEffect(() => {
    if (lockedVesselId) return;
    if (bookableVessels.some((item) => item.id === vesselId)) return;
    setVesselId(bookableVessels[0]?.id ?? "");
  }, [bookableVessels, lockedVesselId, vesselId]);

  const source =
    sourceReservation ??
    (vessel ? sourceReservationForVessel(state.reservations, state.berths, vessel.id, berthId) : undefined);
  const sourceBerth = source ? state.berths.find((item) => item.id === source.berthId) : undefined;
  const showKeepFree = Boolean(source);
  const destIsYard = dest?.kind === "boatyard";
  const destModule = dest ? spaceKindToModule(dest.kind) : undefined;
  const machine = destModule ? equipmentForModule(state.equipment, destModule) : undefined;
  const slots = machine ? buildDaySlots(machine) : [];
  const jobType = jobTypes.find((item) => item.id === jobTypeId);
  const isTooLong = Boolean(vessel && dest && vessel.lengthM > dest.lengthM);
  const canConfirm = Boolean(vessel && dest && start && end && start <= end && (!destIsYard || jobType));
  const labels = keepFreeLabels(sourceBerth?.kind, state.settings);

  function occupancyLabel(id: string): string {
    const exclude = mode === "move" && source ? source.id : undefined;
    const taken = conflictDetailsForBerth(state.reservations, state.berths, id, start, end, exclude);
    return taken ? " — unavailable" : "";
  }

  function onJobTypeChange(nextId: string) {
    setJobTypeId(nextId);
    const duration = jobTypes.find((item) => item.id === nextId)?.defaultDurationDays ?? 1;
    setEnd(addDays(start, Math.max(duration, 1) - 1));
  }

  function onDestChange(nextId: string) {
    setBerthId(nextId);
    const nextDest = state.berths.find((item) => item.id === nextId);
    if (nextDest?.kind === "boatyard") {
      const duration = jobTypes.find((item) => item.id === jobTypeId)?.defaultDurationDays ?? 1;
      setEnd(addDays(start, Math.max(duration, 1) - 1));
    }
  }

  function onConfirm() {
    if (!canConfirm || !vessel || !dest) return;
    if (sourceBerth?.kind === "wet" && isLandKind(dest.kind)) {
      toast.error("Water berth boats stay on the calendar");
      return;
    }
    const exclude = mode === "move" && source ? source.id : undefined;
    const nextConflict = conflictDetailsForBerth(
      state.reservations,
      state.berths,
      dest.id,
      start,
      end,
      exclude
    );
    if (nextConflict) {
      setConflict(nextConflict);
      return;
    }
    if (destModule) {
      const eqConflict = conflictDetailsForEquipment(
        state.equipmentBookings,
        state.equipment,
        destModule,
        start,
        liftTime
      );
      if (eqConflict) {
        setEquipmentConflict(eqConflict);
        return;
      }
    }
    const ok = placeBooking({
      vesselId: vessel.id,
      destBerthId: dest.id,
      start,
      end,
      mode: showKeepFree ? mode : "keep",
      sourceReservationId: source?.id,
      jobTypeId: destIsYard ? jobTypeId : undefined,
      liftTime: destModule ? liftTime : undefined,
    });
    if (!ok) {
      toast.error("Could not place that booking");
      return;
    }
    toast.success(
      showKeepFree && mode === "keep"
        ? `Booked ${dest.name} — previous space kept`
        : showKeepFree && mode === "move"
          ? `Moved to ${dest.name}`
          : `Booked ${dest.name}`
    );
    if (destModule) {
      navigate(`${modulePath(destModule)}?tab=occupancy`);
    }
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-booking-title"
        data-place-booking-modal
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="place-booking-title" className="text-sm font-semibold text-neutral-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lockedVesselId ? (
            <p className="text-sm text-neutral-800">
              {vessel?.name ?? "Boat"}
              {sourceBerth ? ` · currently ${sourceBerth.name}` : ""}
            </p>
          ) : (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">Boat</span>
              <select
                value={vesselId}
                onChange={(event) => setVesselId(event.target.value)}
                data-place-vessel-select
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
              >
                {bookableVessels.map((item) => {
                    const live = sourceReservationForVessel(state.reservations, state.berths, item.id);
                    const liveBerth = live ? state.berths.find((berth) => berth.id === live.berthId) : undefined;
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {liveBerth ? ` · ${liveBerth.name}` : " · not booked"}
                      </option>
                    );
                  })}
              </select>
            </label>
          )}

          {destBerthId ? (
            <p className="text-sm text-neutral-800">
              {dest?.name} · {dest ? kindLabel(dest.kind, state.settings) : ""}
            </p>
          ) : (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">Place on</span>
              <select
                value={berthId}
                onChange={(event) => onDestChange(event.target.value)}
                data-place-berth-select
                data-yard-berth-select={destKind === "boatyard" ? true : undefined}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
              >
                {destBerths.map((berth) => (
                  <option key={berth.id} value={berth.id}>
                    {berth.name} · {kindLabel(berth.kind, state.settings)}
                    {occupancyLabel(berth.id)}
                  </option>
                ))}
              </select>
            </label>
          )}

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

          {destIsYard ? (
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
          ) : null}

          {destModule ? (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">
                {destIsYard ? "Lift slot (travel lift)" : "Lift slot (fork lift)"}
              </span>
              <span className="block text-xs text-neutral-500">
                Lift first. The job or stay happens on land, then you schedule launch.
              </span>
              {slots.length > 0 ? (
                <select
                  value={liftTime}
                  onChange={(event) => setLiftTime(event.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                >
                  {slots.map((slot) => {
                    const taken = state.equipmentBookings.some(
                      (booking) =>
                        booking.equipmentId === machine?.id &&
                        booking.date === start &&
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
                  value={liftTime}
                  onChange={(event) => setLiftTime(event.target.value)}
                  className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              )}
            </label>
          ) : null}

          {showKeepFree ? (
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-neutral-500">{labels.legend}</legend>
              <label className="flex items-start gap-2 text-sm text-neutral-800">
                <input
                  type="radio"
                  name="place-booking-mode"
                  value="keep"
                  checked={mode === "keep"}
                  onChange={() => setMode("keep")}
                  className="mt-0.5"
                />
                <span className="font-medium">{labels.keep}</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-neutral-800">
                <input
                  type="radio"
                  name="place-booking-mode"
                  value="move"
                  checked={mode === "move"}
                  onChange={() => setMode("move")}
                  className="mt-0.5"
                />
                <span className="font-medium">{labels.move}</span>
              </label>
            </fieldset>
          ) : null}

          {isTooLong && dest && vessel ? (
            <p
              data-length-warning
              className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900"
            >
              Vessel length ({vessel.lengthM} m) is greater than this space ({dest.lengthM} m).
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="harbr" className="flex-1" disabled={!canConfirm} onClick={onConfirm}>
            Confirm
          </Button>
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
      {equipmentConflict ? (
        <EquipmentConflictModal conflict={equipmentConflict} onClose={() => setEquipmentConflict(null)} />
      ) : null}
    </div>,
    document.body
  );
}
