import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { dnlStatus } from "../../lib/dnl";
import { buildDaySlots, equipmentForModule } from "../../lib/equipment";
import { draftFromLaunchTasks, invoiceBannerText, launchLiftDraftLabel, unbilledDoneLaunchTasks } from "../../lib/invoice";
import { isDryKind } from "../../lib/modules";
import { statusAfterTaskDone } from "../../lib/status";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask, TaskType, VesselStorageStatus } from "../../types/domain";
import { EditableChecklist } from "../checklist/editable-checklist";
import { DnlBadge } from "../dnl-badge";
import { Button } from "../ui/button";

interface TaskRowProps {
  task: LaunchTask;
  isOpen: boolean;
  error?: string;
  onToggleOpen: () => void;
  onError: (message: string | null) => void;
}

const STATUS_LABEL: Record<VesselStorageStatus, string> = {
  stored: "Stored",
  launched: "Launched",
  departed: "Departed",
};

const STATUS_BADGE: Record<VesselStorageStatus, string> = {
  stored: "bg-neutral-100 text-neutral-800",
  launched: "bg-teal-50 text-teal-800",
  departed: "bg-amber-50 text-amber-900",
};

const TASK_STATUS_LABEL: Record<LaunchTask["status"], string> = {
  requested: "Requested",
  open: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

const TASK_STATUS_BADGE: Record<LaunchTask["status"], string> = {
  requested: "bg-amber-100 text-amber-900",
  open: "bg-violet-50 text-violet-800",
  in_progress: "bg-sky-100 text-sky-900",
  done: "bg-teal-50 text-teal-800",
  declined: "bg-neutral-100 text-neutral-600",
};

function illegalDoneMessage(kind: TaskType["kind"], current: VesselStorageStatus): string | null {
  if (kind === "other") return null;
  if (statusAfterTaskDone(kind, current) !== null) return null;
  if (kind === "retrieval" && current === "stored") {
    return "Cannot mark lift done while vessel is still stored.";
  }
  if (kind === "launch") {
    return `Cannot mark launch done while vessel is ${current}.`;
  }
  return "This status change is not allowed from the current vessel status.";
}

function spaceWord(kind: string | undefined): string {
  if (kind === "dry_storage") return "Rack";
  if (kind === "wet") return "Berth";
  return "Yard";
}

export function TaskRow({ task, isOpen, error, onToggleOpen, onError }: TaskRowProps) {
  const navigate = useNavigate();
  const { state, setTaskChecklist, markTaskDone, startTask, setVesselDeparted, createDraftFromDryStack, rescheduleTask, setSelectedReservationId } = useMarina();
  const taskType = state.taskTypes.find((item) => item.id === task.taskTypeId);
  const customer = state.customers.find((item) => item.id === task.customerId);
  const vessel = state.vessels.find((item) => item.id === task.vesselId);
  const berth = state.berths.find((item) => item.id === task.berthId);

  if (!taskType || !customer || !vessel || !berth) return null;

  const vesselId = vessel.id;
  const taskTypeName = taskType.name;
  const doneCount = task.checklist.filter((item) => item.done).length;
  const kind = taskType.kind;
  const storageStatus = vessel.storageStatus;
  const dnl = dnlStatus(vessel, customer, state.settings);
  const unbilledDone = unbilledDoneLaunchTasks(state.launchTasks, vesselId);
  const draftLabel = launchLiftDraftLabel(unbilledDone, state.taskTypes);
  const canInvoice = state.role === "office" && task.status === "done" && unbilledDone.length > 0;

  function invoiceReservationId(): string | undefined {
    const live = state.reservations.filter(
      (item) => item.vesselId === vesselId && item.status !== "archived"
    );
    const rack = live.find((item) => {
      const space = state.berths.find((space) => space.id === item.berthId);
      return space ? isDryKind(space.kind) : false;
    });
    return rack?.id ?? live[0]?.id;
  }

  function onCreateDraft() {
    const reservationId = invoiceReservationId();
    if (!reservationId) {
      toast.error("No booking to invoice against");
      return;
    }
    const unbilled = unbilledDoneLaunchTasks(state.launchTasks, vesselId);
    const previewLines = draftFromLaunchTasks(unbilled, state.taskTypes, state.products);
    if (unbilled.length === 0) {
      toast.error("Nothing left to invoice");
      return;
    }
    if (previewLines.length === 0) {
      toast.error("Link a product to the Launch/Lift task type in Settings");
      return;
    }
    const invoiceId = createDraftFromDryStack(reservationId);
    if (!invoiceId) {
      toast.error("Nothing left to invoice");
      return;
    }
    toast.success(invoiceBannerText(previewLines));
    navigate(`/invoices/${invoiceId}`);
  }

  function onStart() {
    if (dnl.blocked) {
      onError(`Cannot start — ${dnl.reasons.join("; ")}`);
      return;
    }
    onError(null);
    startTask(task.id);
    toast.success(`${taskTypeName} started — customer notified`);
  }

  function onMarkDone() {
    if (dnl.blocked) {
      onError(`Cannot mark done — ${dnl.reasons.join("; ")}`);
      return;
    }
    const message =
      task.module === "boatyard" || task.module === "other" ? null : illegalDoneMessage(kind, storageStatus);
    if (message) {
      onError(message);
      return;
    }
    onError(null);
    markTaskDone(task.id);
    const willBill = unbilledDone.some((item) => item.id === task.id) ? unbilledDone : [...unbilledDone, task];
    const label = launchLiftDraftLabel(willBill, state.taskTypes);
    toast.success(
      willBill.length > 1 ? `${taskTypeName} done — invoice ${label}` : `${taskTypeName} done`
    );
  }

  function onDeparted() {
    onError(null);
    setVesselDeparted(vesselId);
    toast.success("Marked departed");
  }

  return (
    <article
      data-task-row
      data-task-id={task.id}
      data-vessel-name={vessel.name}
      data-task-kind={kind}
      data-task-time={task.time}
      data-task-status={task.status}
      data-storage-status={storageStatus}
      data-dnl={dnl.blocked ? "blocked" : "clear"}
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        task.status === "in_progress" && "border-violet-300 bg-violet-50/50",
        task.status === "done" && "border-neutral-200 bg-neutral-50 shadow-none"
      )}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          className="flex min-w-0 items-start gap-4 text-left"
        >
          <div className="min-w-[5.5rem] shrink-0">
            <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-neutral-900">
              {task.time}
            </p>
            <p className="mt-1.5 text-xs font-medium text-neutral-500">{taskType.name}</p>
            <span
              data-task-status-tag
              className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${TASK_STATUS_BADGE[task.status]}`}
            >
              {TASK_STATUS_LABEL[task.status]}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-900">{vessel.name}</h3>
              <span
                data-status-badge
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[storageStatus]}`}
              >
                {STATUS_LABEL[storageStatus]}
              </span>
              <DnlBadge status={dnl} />
            </div>
            <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
              <div>
                <dt className="sr-only">Owner</dt>
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt className="mr-1 inline text-neutral-400">{spaceWord(berth.kind)} </dt>
                <dd className="inline font-medium text-neutral-800">{berth.name}</dd>
              </div>
              <div>
                <dt className="mr-1 inline text-neutral-400">Checks </dt>
                <dd data-checklist-progress className="inline tabular-nums">
                  {doneCount}/{task.checklist.length}
                </dd>
              </div>
            </dl>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const reservationId =
                task.reservationId ??
                state.reservations.find((item) => item.vesselId === vesselId && item.status !== "archived")?.id;
              if (reservationId) setSelectedReservationId(reservationId);
            }}
          >
            Boat
          </Button>
          {task.status === "open" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStart}
              data-start-task
              disabled={dnl.blocked}
            >
              Start
            </Button>
          ) : null}
          {task.status === "open" || task.status === "in_progress" ? (
            <Button
              type="button"
              variant="harbr"
              size="sm"
              onClick={onMarkDone}
              data-mark-done
              disabled={dnl.blocked}
            >
              Done
            </Button>
          ) : task.status === "done" ? (
            <>
              <span className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
                {task.invoiceId ? "Invoiced" : "Done"}
              </span>
              {canInvoice ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-create-dry-invoice
                  data-invoice-includes={draftLabel || undefined}
                  title={draftLabel ? `This draft: ${draftLabel}` : undefined}
                  aria-label={draftLabel ? `Create draft invoice for ${draftLabel}` : "Create draft invoice"}
                  onClick={onCreateDraft}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {draftLabel ? `Invoice ${draftLabel}` : "Create draft invoice"}
                </Button>
              ) : null}
            </>
          ) : null}
          {storageStatus === "launched" ? (
            <Button type="button" variant="outline" size="sm" onClick={onDeparted} data-set-departed>
              Departed
            </Button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3" data-open-task>
          {dnl.blocked ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Do not launch: {dnl.reasons.join("; ")}
            </p>
          ) : null}
          {task.status !== "done" && task.status !== "declined" ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="space-y-1 text-xs text-neutral-500">
                Date
                <input
                  type="date"
                  defaultValue={task.date}
                  data-reschedule-date
                  className="block rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-900"
                  onBlur={(event) => {
                    if (event.target.value && event.target.value !== task.date) {
                      const ok = rescheduleTask(task.id, event.target.value, task.time);
                      toast[ok ? "success" : "error"](
                        ok ? "Date changed — customer emailed" : "That lift slot is taken"
                      );
                    }
                  }}
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-500">
                Time
                {(() => {
                  const machine = equipmentForModule(state.equipment, task.module);
                  const slots = machine ? buildDaySlots(machine) : [];
                  if (slots.length === 0) {
                    return (
                      <input
                        type="time"
                        defaultValue={task.time}
                        data-reschedule-time
                        className="block rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-900"
                        onBlur={(event) => {
                          if (event.target.value && event.target.value !== task.time) {
                            const ok = rescheduleTask(task.id, task.date, event.target.value);
                            toast[ok ? "success" : "error"](
                              ok ? "Time changed — customer emailed" : "That lift slot is taken"
                            );
                          }
                        }}
                      />
                    );
                  }
                  return (
                    <select
                      defaultValue={task.time}
                      data-reschedule-time
                      className="block rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900"
                      onChange={(event) => {
                        if (event.target.value !== task.time) {
                          const ok = rescheduleTask(task.id, task.date, event.target.value);
                          toast[ok ? "success" : "error"](
                            ok ? "Time changed — customer emailed" : "That lift slot is taken"
                          );
                        }
                      }}
                    >
                      {slots.map((slot) => {
                        const taken = state.equipmentBookings.some(
                          (booking) =>
                            booking.equipmentId === machine?.id &&
                            booking.date === task.date &&
                            booking.startTime === slot &&
                            booking.taskId !== task.id
                        );
                        return (
                          <option key={slot} value={slot} disabled={taken}>
                            {slot}
                            {taken ? " — taken" : ""}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </label>
            </div>
          ) : null}
          <p className="text-xs font-medium text-neutral-500">Checklist</p>
          <EditableChecklist
            items={task.checklist}
            categories={state.settings.checklistCategories}
            fallbackCategory={kind === "retrieval" ? "Lift" : "Launch"}
            disabled={task.status === "done" || task.status === "declined"}
            onChange={(checklist) => setTaskChecklist(task.id, checklist)}
            addLabel="Add checklist item"
            emptyHint="No items — add the checks for this task."
          />
        </div>
      ) : null}

      {error ? (
        <p data-transition-error className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}
