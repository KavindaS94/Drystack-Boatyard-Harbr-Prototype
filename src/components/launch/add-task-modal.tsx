import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  buildDaySlots,
  conflictDetailsForEquipment,
  equipmentForModule,
  formatDurationMinutes,
  minutesBetweenSlots,
  timeToMinutes,
} from "../../lib/equipment";
import { remapTravelLiftJobTypeId, workJobTypes } from "../../lib/job-types";
import { moduleLabel } from "../../lib/modules";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { Berth, Customer, Reservation, TaskModule, Vessel, WorkBy } from "../../types/domain";
import { EquipmentConflictModal } from "../reservation-panel/equipment-conflict-modal";
import { Button } from "../ui/button";

interface AddTaskModalProps {
  date: string;
  module: TaskModule;
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

function firstSlotAfter(slots: string[], time: string): string | undefined {
  return slots.find((slot) => timeToMinutes(slot) > timeToMinutes(time));
}

function defaultLaunch(slots: string[], liftTime: string): string {
  const sixHoursLater = slots.find((slot) => timeToMinutes(slot) >= timeToMinutes(liftTime) + 360);
  return sixHoursLater ?? firstSlotAfter(slots, liftTime) ?? liftTime;
}

const WORK_BY_LABEL: Record<WorkBy, string> = {
  marina: "Marina",
  diy: "DIY",
  contractor: "Contractor",
};

export function AddTaskModal({ date, module, initialTime, onClose }: AddTaskModalProps) {
  const { state, addLaunchTask, addYardStay } = useMarina();
  const isYard = module === "boatyard";
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const types = state.taskTypes.filter((item) => {
    if (!item.active) return false;
    if (module === "other") return item.kind === "other" || item.module === "other";
    return item.module === module;
  });
  const jobTypes = useMemo(
    () => workJobTypes(state.jobTypes).filter((item) => item.active),
    [state.jobTypes]
  );
  const [taskTypeId, setTaskTypeId] = useState(
    () => types.find((item) => item.kind === "launch")?.id ?? types[0]?.id ?? ""
  );
  const [jobTypeId, setJobTypeId] = useState(
    () => jobTypes.find((item) => item.id === "jt-antifoul")?.id ?? jobTypes[0]?.id ?? ""
  );
  const [workBy, setWorkBy] = useState<WorkBy>("marina");
  const [contractorName, setContractorName] = useState("Marine Works");
  const [notes, setNotes] = useState("");
  const [yardStep, setYardStep] = useState<1 | 2>(1);
  const machine = equipmentForModule(state.equipment, module);
  const slots = machine ? buildDaySlots(machine) : [];
  const [liftDate, setLiftDate] = useState(date);
  const [launchDate, setLaunchDate] = useState(date);
  const [liftTime, setLiftTime] = useState(initialTime ?? slots[2] ?? slots[0] ?? "09:00");
  const [launchTime, setLaunchTime] = useState(() => defaultLaunch(slots, initialTime ?? slots[2] ?? slots[0] ?? "09:00"));
  const [taskDate, setTaskDate] = useState(date);
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
        if (coversDate(reservation, taskDate)) consider(reservation);
        continue;
      }
      if (berth.kind === module) {
        if (module === "boatyard" || coversDate(reservation, taskDate)) consider(reservation);
      }
    }
    if (module !== "other" && module !== "boatyard") {
      for (const reservation of state.reservations) {
        if (reservation.status === "archived" || !coversDate(reservation, taskDate)) continue;
        const berth = state.berths.find((item) => item.id === reservation.berthId);
        if (berth?.kind === "wet") consider(reservation);
      }
    }
    return out;
  }, [module, state.berths, state.customers, state.reservations, state.vessels, taskDate]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (item) =>
        item.customer.name.toLowerCase().includes(q) || item.vessel.name.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const selected = clients.find((item) => item.reservation.id === selectedKey) ?? null;
  const selectedJobType = jobTypes.find((item) => item.id === jobTypeId);
  const ownTaskIds = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(
      state.launchTasks
        .filter(
          (item) =>
            item.reservationId === selected.reservation.id &&
            item.module === module &&
            item.status !== "declined"
        )
        .map((item) => item.id)
    );
  }, [module, selected, state.launchTasks]);
  const repairMinutes = minutesBetweenSlots(liftDate, liftTime, launchDate, launchTime);
  const repairLabel = formatDurationMinutes(repairMinutes);
  const stayRange =
    liftDate === launchDate
      ? `${liftTime} lift → ${launchTime} launch`
      : `${liftDate} ${liftTime} lift → ${launchDate} ${launchTime} launch`;
  const canContinue = Boolean(selected && liftTime && launchTime && repairMinutes > 0);
  const canSave = isYard
    ? Boolean(canContinue && jobTypeId && (workBy !== "contractor" || contractorName.trim()))
    : Boolean(selected && taskTypeId && time);

  function slotTaken(slot: string, onDate: string) {
    return state.equipmentBookings.some(
      (booking) =>
        booking.equipmentId === machine?.id &&
        booking.date === onDate &&
        booking.startTime === slot &&
        !ownTaskIds.has(booking.taskId)
    );
  }

  function onLiftDateChange(next: string) {
    setLiftDate(next);
    if (launchDate < next || launchDate === liftDate) setLaunchDate(next);
  }

  function onLiftChange(next: string) {
    setLiftTime(next);
    if (launchDate === liftDate && timeToMinutes(launchTime) <= timeToMinutes(next)) {
      const later = defaultLaunch(slots, next);
      if (later !== next) setLaunchTime(later);
    }
  }

  function onSave() {
    if (!selected) return;
    if (isYard) {
      const liftTypeId = state.taskTypes.find((item) => item.module === "boatyard" && item.kind === "retrieval")?.id;
      const launchTypeId = state.taskTypes.find((item) => item.module === "boatyard" && item.kind === "launch")?.id;
      const ownLift = state.launchTasks.find(
        (item) =>
          item.reservationId === selected.reservation.id &&
          item.taskTypeId === liftTypeId &&
          item.status !== "declined"
      );
      const ownLaunch = state.launchTasks.find(
        (item) =>
          item.reservationId === selected.reservation.id &&
          item.taskTypeId === launchTypeId &&
          item.status !== "declined"
      );
      const liftConflict = conflictDetailsForEquipment(
        state.equipmentBookings,
        state.equipment,
        module,
        liftDate,
        liftTime,
        ownLift?.id
      );
      const launchConflict = conflictDetailsForEquipment(
        state.equipmentBookings,
        state.equipment,
        module,
        launchDate,
        launchTime,
        ownLaunch?.id
      );
      if (liftConflict || launchConflict) {
        setEquipmentConflict(liftConflict ?? launchConflict);
        return;
      }
      const ok = addYardStay({
        customerId: selected.customer.id,
        vesselId: selected.vessel.id,
        berthId: selected.berth.id,
        reservationId: selected.reservation.id,
        liftDate,
        launchDate,
        liftTime,
        launchTime,
        jobTypeId,
        workBy,
        contractorName: workBy === "contractor" ? contractorName.trim() : undefined,
        notes,
      });
      if (!ok) {
        toast.error("Those travel-lift slots are already taken, or lift is already done");
        return;
      }
      toast.success(
        `${selectedJobType?.name ?? "Job"} · lift ${liftTime} · launch ${launchTime}${
          repairLabel ? ` · ${repairLabel}` : ""
        } — customer emailed`
      );
      onClose();
      return;
    }

    if (!taskTypeId || !time) return;
    const taskType = state.taskTypes.find((item) => item.id === taskTypeId);
    if (taskType) {
      const conflict = conflictDetailsForEquipment(
        state.equipmentBookings,
        state.equipment,
        taskType.module,
        taskDate,
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
      date: taskDate,
      time,
      reservationId: selected.reservation.id,
      source: "staff",
    });
    if (!ok) {
      toast.error("That lift slot is already taken");
      return;
    }
    toast.success("Task booked — customer emailed");
    onClose();
  }

  const label = moduleLabel(module, state.settings);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        data-add-task-modal
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="add-task-title" className="text-base font-semibold text-neutral-900">
              Add task · {label}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isYard
                ? yardStep === 1
                  ? "Pick the boat, then set lift and launch."
                  : "Describe the work that happens between lift and launch."
                : machine
                  ? `${machine.name} · ${machine.slotMinutes} min slots`
                  : "Book a launch or lift."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
            Close
          </button>
        </div>

        {isYard ? <YardStepper step={yardStep} onBack={() => setYardStep(1)} /> : null}

        <div className="mt-4 space-y-4">
          {!isYard || yardStep === 1 ? (
            <>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Boat or owner</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedKey(null);
              }}
              placeholder={isYard ? "Search a boat on the yard" : `Search a ${label.toLowerCase()} boat`}
              data-add-task-search
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
          </label>

          {selected ? (
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{selected.vessel.name}</p>
                <p className="text-xs text-neutral-500">
                  {selected.customer.name} · {selected.berth.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Change
              </button>
            </div>
          ) : (
            <ul className="max-h-44 overflow-y-auto rounded-lg border border-neutral-200" data-add-task-results>
              {matches.length === 0 ? (
                <li className="px-3 py-3 text-sm text-neutral-500">No matching boats.</li>
              ) : (
                matches.map((item) => (
                  <li key={item.reservation.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(item.reservation.id);
                        const job = item.reservation.job;
                        if (!isYard) return;
                        if (job?.liftTime) setLiftTime(job.liftTime);
                        if (job?.launchTime) setLaunchTime(job.launchTime);
                        setLiftDate(item.reservation.startDate);
                        setLaunchDate(job?.launchDate ?? item.reservation.endDate);
                        if (job?.typeId) setJobTypeId(remapTravelLiftJobTypeId(job.typeId));
                        if (job?.workBy) setWorkBy(job.workBy);
                        setContractorName(job?.contractorName || "Marine Works");
                        setNotes(job?.notes ?? "");
                      }}
                      data-customer-name={item.customer.name}
                      data-vessel-name={item.vessel.name}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">{item.vessel.name}</span>
                      <span className="text-xs text-neutral-500">
                        {item.customer.name} · {item.berth.name}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
            </>
          ) : null}

          {isYard && yardStep === 1 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-neutral-500">Lift</span>
                  <input
                    type="date"
                    value={liftDate}
                    onChange={(event) => onLiftDateChange(event.target.value)}
                    data-add-task-lift-date
                    className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                  />
                  <SlotSelect
                    value={liftTime}
                    slots={slots}
                    taken={(slot) => slotTaken(slot, liftDate)}
                    onChange={onLiftChange}
                    testId="add-task-lift"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-neutral-500">Launch</span>
                  <input
                    type="date"
                    value={launchDate}
                    min={liftDate}
                    onChange={(event) => setLaunchDate(event.target.value)}
                    data-add-task-launch-date
                    className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                  />
                  <SlotSelect
                    value={launchTime}
                    slots={slots}
                    taken={(slot) =>
                      slotTaken(slot, launchDate) ||
                      (launchDate === liftDate && timeToMinutes(slot) <= timeToMinutes(liftTime))
                    }
                    onChange={setLaunchTime}
                    testId="add-task-launch"
                  />
                </div>
              </div>
              <div
                className="rounded-lg border border-[hsl(252,75%,88%)] bg-[hsl(252,75%,97%)] px-3 py-2"
                data-repair-duration
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[hsl(252,75%,40%)]">Repair time</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                  {repairLabel || "Launch must be after lift"}
                </p>
                {repairLabel ? (
                  <p className="text-xs text-neutral-500">
                    {stayRange}. Next, describe the job.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {isYard && yardStep === 2 ? (
            <div className="space-y-3">
              {selected ? (
                <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">{selected.vessel.name}</span>
                  {" · "}
                  {stayRange}
                  {repairLabel ? ` · ${repairLabel}` : ""}
                </p>
              ) : null}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Job type</span>
                <select
                  value={jobTypeId}
                  onChange={(event) => setJobTypeId(event.target.value)}
                  data-add-task-job-type
                  className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                >
                  {jobTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-neutral-500">Who does the work</span>
                <div className="flex flex-wrap gap-3">
                  {(["marina", "diy", "contractor"] as WorkBy[]).map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-neutral-800">
                      <input
                        type="radio"
                        name="add-task-work-by"
                        checked={workBy === value}
                        onChange={() => setWorkBy(value)}
                      />
                      {WORK_BY_LABEL[value]}
                    </label>
                  ))}
                </div>
                {workBy === "contractor" ? (
                  <input
                    value={contractorName}
                    onChange={(event) => setContractorName(event.target.value)}
                    placeholder="Contractor name"
                    data-add-task-contractor
                    className="mt-1 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                  />
                ) : null}
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Describe the job</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="What the crew should do between lift and launch"
                  data-add-task-notes
                  className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          ) : null}

          {!isYard ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Date</span>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(event) => setTaskDate(event.target.value)}
                  data-add-task-date
                  className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Time</span>
                <SlotSelect
                  value={time}
                  slots={slots}
                  taken={(slot) => slotTaken(slot, taskDate)}
                  onChange={setTime}
                  testId="add-task-time"
                  fallback
                />
              </label>
              <label className="col-span-2 block space-y-1">
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
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          {isYard && yardStep === 2 ? (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setYardStep(1)}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          )}
          {isYard && yardStep === 1 ? (
            <Button
              type="button"
              variant="harbr"
              className="flex-1"
              disabled={!canContinue}
              onClick={() => setYardStep(2)}
              data-add-task-next
            >
              Next
            </Button>
          ) : (
            <Button type="button" variant="harbr" className="flex-1" disabled={!canSave} onClick={onSave} data-add-task-save>
              Save
            </Button>
          )}
        </div>
      </div>
      {equipmentConflict ? (
        <EquipmentConflictModal conflict={equipmentConflict} onClose={() => setEquipmentConflict(null)} />
      ) : null}
    </div>,
    document.body
  );
}

function YardStepper({ step, onBack }: { step: 1 | 2; onBack: () => void }) {
  return (
    <ol className="mt-4 grid grid-cols-2 gap-2" data-add-task-stepper>
      <li>
        <button
          type="button"
          onClick={step === 2 ? onBack : undefined}
          disabled={step === 1}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left",
            step === 1
              ? "border-[hsl(252,75%,80%)] bg-[hsl(252,75%,97%)]"
              : "border-neutral-200 bg-neutral-50 hover:bg-white"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              step === 1
                ? "bg-[hsl(252,75%,70%)] text-white"
                : "bg-teal-600 text-white"
            )}
          >
            {step === 2 ? <Check className="h-3.5 w-3.5" /> : "1"}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-neutral-900">Lift & launch</span>
            <span className="block text-xs text-neutral-500">Dates and times</span>
          </span>
        </button>
      </li>
      <li>
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2",
            step === 2
              ? "border-[hsl(252,75%,80%)] bg-[hsl(252,75%,97%)]"
              : "border-neutral-200 bg-white"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              step === 2 ? "bg-[hsl(252,75%,70%)] text-white" : "bg-neutral-200 text-neutral-600"
            )}
          >
            2
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-neutral-900">Describe job</span>
            <span className="block text-xs text-neutral-500">Type, who, notes</span>
          </span>
        </div>
      </li>
    </ol>
  );
}

function SlotSelect({
  value,
  slots,
  taken,
  onChange,
  testId,
  fallback = false,
}: {
  value: string;
  slots: string[];
  taken: (slot: string) => boolean;
  onChange: (value: string) => void;
  testId: string;
  fallback?: boolean;
}) {
  if (slots.length === 0) {
    return (
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-add-task-time={fallback || undefined}
        data-testid={testId}
        className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
      />
    );
  }
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      data-add-task-time={fallback || testId === "add-task-time" ? true : undefined}
      data-testid={testId}
      className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
    >
      {slots.map((slot) => {
        const isTaken = taken(slot);
        return (
          <option key={slot} value={slot} disabled={isTaken && slot !== value}>
            {slot}
            {isTaken && slot !== value ? " — taken" : ""}
          </option>
        );
      })}
    </select>
  );
}
