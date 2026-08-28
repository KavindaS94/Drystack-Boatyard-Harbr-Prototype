import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { dnlStatus } from "../../lib/dnl";
import { draftFromLaunchTasks, invoiceBannerText, launchLiftDraftLabel, unbilledDoneLaunchTasks } from "../../lib/invoice";
import { statusAfterTaskDone } from "../../lib/status";
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

export function TaskRow({ task, isOpen, error, onToggleOpen, onError }: TaskRowProps) {
  const navigate = useNavigate();
  const { state, setTaskChecklist, markTaskDone, startTask, setVesselDeparted, createDraftFromDryStack } = useMarina();
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
    const rack = live.find((item) => state.berths.find((space) => space.id === item.berthId)?.kind === "dry_storage");
    return rack?.id ?? live[0]?.id;
  }

  function onCreateDraft() {
    const reservationId = invoiceReservationId();
    if (!reservationId) {
      toast.error("No booking to invoice against");
      return;
    }
    const unbilledDone = unbilledDoneLaunchTasks(state.launchTasks, vesselId);
    const previewLines = draftFromLaunchTasks(unbilledDone, state.taskTypes, state.products);
    if (unbilledDone.length === 0) {
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
    const message = illegalDoneMessage(kind, storageStatus);
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
      className="rounded-lg border border-neutral-200 bg-white p-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left"
        >
          <span className="text-sm font-semibold tabular-nums text-neutral-900">{task.time}</span>
          <span className="text-sm text-neutral-800">{taskType.name}</span>
          <span className="text-sm text-neutral-800">{customer.name}</span>
          <span className="text-sm text-neutral-800">{vessel.name}</span>
          <span className="text-sm text-neutral-600">{berth.name}</span>
          <span
            data-status-badge
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[storageStatus]}`}
          >
            {STATUS_LABEL[storageStatus]}
          </span>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800">
            {TASK_STATUS_LABEL[task.status]}
          </span>
          <DnlBadge status={dnl} />
          <span data-checklist-progress className="text-xs tabular-nums text-neutral-500">
            {doneCount}/{task.checklist.length}
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          {task.status === "open" ? (
            <button
              type="button"
              onClick={onStart}
              data-start-task
              disabled={dnl.blocked}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start
            </button>
          ) : null}
          {task.status === "open" || task.status === "in_progress" ? (
            <button
              type="button"
              onClick={onMarkDone}
              data-mark-done
              disabled={dnl.blocked}
              className="rounded-md bg-[hsl(252,75%,70%)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[hsl(252,75%,60%)] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Done
            </button>
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
                  className="h-8"
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
            <button
              type="button"
              onClick={onDeparted}
              data-set-departed
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Departed
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3" data-open-task>
          {dnl.blocked ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Do not launch: {dnl.reasons.join("; ")}
            </p>
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
