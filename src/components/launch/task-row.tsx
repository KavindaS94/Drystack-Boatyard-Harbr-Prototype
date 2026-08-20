import { statusAfterTaskDone } from "../../lib/status";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask, TaskType, VesselStorageStatus } from "../../types/domain";
import { toast } from "sonner";

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
  const { state, toggleTaskCheck, markTaskDone, setVesselDeparted } = useMarina();
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

  function onMarkDone() {
    const message = illegalDoneMessage(kind, storageStatus);
    if (message) {
      onError(message);
      return;
    }
    onError(null);
    markTaskDone(task.id);
    toast.success(`${taskTypeName} done`);
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
          <span data-checklist-progress className="text-xs tabular-nums text-neutral-500">
            {doneCount}/{task.checklist.length}
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          {task.status === "open" ? (
            <button
              type="button"
              onClick={onMarkDone}
              data-mark-done
              className="rounded-md bg-[hsl(252,75%,70%)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[hsl(252,75%,60%)]"
            >
              Done
            </button>
          ) : (
            <span className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600">Done</span>
          )}
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
          <p className="text-xs font-medium text-neutral-500">Checklist</p>
          <ul className="space-y-1">
            {task.checklist.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={task.status === "done"}
                    onChange={() => toggleTaskCheck(task.id, index)}
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
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
