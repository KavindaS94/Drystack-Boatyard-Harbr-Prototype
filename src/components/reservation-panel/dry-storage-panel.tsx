import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { draftFromLaunchTasks, invoiceBannerText } from "../../lib/invoice";
import { useMarina } from "../../store/marina-store";
import type { VesselStorageStatus } from "../../types/domain";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface DryStoragePanelProps {
  reservationId: string;
  vesselId: string;
  storageStatus: VesselStorageStatus;
}

const STATUS_LABEL: Record<VesselStorageStatus, string> = {
  stored: "Stored",
  launched: "Launched",
  departed: "Departed",
};

const STATUS_TONE: Record<VesselStorageStatus, "neutral" | "success" | "warning"> = {
  stored: "neutral",
  launched: "success",
  departed: "warning",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  open: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

export function DryStoragePanel({ reservationId, vesselId, storageStatus }: DryStoragePanelProps) {
  const navigate = useNavigate();
  const { state, createDraftFromDryStack } = useMarina();
  const tasks = state.launchTasks
    .filter((task) => task.vesselId === vesselId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const unbilledDone = tasks.filter((task) => task.status === "done" && !task.invoiceId);
  const previewLines = draftFromLaunchTasks(unbilledDone, state.taskTypes, state.products);
  const canCreateDraft = state.role === "office";

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <div>
        <p className="text-xs font-medium text-neutral-500">Status</p>
        <span className="mt-1 inline-block" data-storage-status={storageStatus}>
          <Badge tone={STATUS_TONE[storageStatus]}>{STATUS_LABEL[storageStatus]}</Badge>
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500">Launch/lift tasks</p>
        {tasks.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">None yet.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {tasks.map((task) => {
              const taskType = state.taskTypes.find((item) => item.id === task.taskTypeId);
              const invoiced = Boolean(task.invoiceId);
              return (
                <li key={task.id} className="text-sm text-neutral-800">
                  {task.time} · {taskType?.name ?? task.taskTypeId} ·{" "}
                  {TASK_STATUS_LABEL[task.status] ?? task.status}
                  {invoiced ? " · Invoiced" : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canCreateDraft ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          data-create-dry-invoice
          onClick={() => {
            if (unbilledDone.length === 0) {
              toast.error(
                tasks.some((task) => task.status === "done")
                  ? "Nothing left to invoice"
                  : "Mark a launch or lift Done first"
              );
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
          }}
        >
          Create draft invoice
        </Button>
      ) : null}

      <p className="text-xs text-neutral-500">
        Monthly rack storage is billed on the booking, not this draft. This invoice is only completed
        launches and lifts that have not been billed yet.
      </p>

      <Link to="/operations/launch-board" className="inline-block text-sm font-medium text-[hsl(252,75%,45%)] underline underline-offset-2">
        Open launch board
      </Link>
    </div>
  );
}
