import { FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  draftFromLaunchTasks,
  invoiceBannerText,
  launchLiftDraftLabel,
  unbilledDoneLaunchTasks,
} from "../../lib/invoice";
import { modulePath, spaceKindToModule } from "../../lib/modules";
import type { TaskModule } from "../../types/domain";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import { Button } from "../ui/button";

const TASK_STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  open: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

interface LaunchLiftInvoiceProps {
  reservationId: string;
  vesselId: string;
  module?: TaskModule;
  showLaunchBoardLink?: boolean;
  className?: string;
}

export function LaunchLiftInvoice({
  reservationId,
  vesselId,
  module,
  showLaunchBoardLink = false,
  className,
}: LaunchLiftInvoiceProps) {
  const navigate = useNavigate();
  const { state, createDraftFromDryStack } = useMarina();
  const tasks = state.launchTasks
    .filter((task) => task.vesselId === vesselId && (!module || task.module === module))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const unbilledDone = unbilledDoneLaunchTasks(state.launchTasks, vesselId).filter(
    (task) => !module || task.module === module
  );
  const previewLines = draftFromLaunchTasks(unbilledDone, state.taskTypes, state.products);
  const draftLabel = launchLiftDraftLabel(unbilledDone, state.taskTypes);
  const canCreateDraft = state.role === "office";

  if (tasks.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-xs font-medium text-neutral-500">Lift then launch</p>
        <p className="mt-0.5 text-xs text-neutral-500">Lift first, then launch when the stay is finished.</p>
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
      </div>

      {canCreateDraft ? (
        <div className="space-y-1.5">
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
            <FileText className="h-4 w-4" />
            Create draft invoice
          </Button>
          {unbilledDone.length > 0 && draftLabel ? (
            <p className="text-xs text-neutral-600" data-invoice-includes>
              This draft: {draftLabel}
              {previewLines.length > 0
                ? ` · $${previewLines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0)}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-neutral-500">
        After launch you can still invoice every unbilled Lift and Launch together. Monthly rack
        storage stays on the booking.
      </p>

      {showLaunchBoardLink ? (
        <Link
          to={(() => {
            const reservation = state.reservations.find((item) => item.id === reservationId);
            const berth = reservation ? state.berths.find((item) => item.id === reservation.berthId) : undefined;
            const dest = berth ? spaceKindToModule(berth.kind) : null;
            return dest ? modulePath(dest) : "/operations/calendar";
          })()}
          className="inline-block text-sm font-medium text-[hsl(252,75%,45%)] underline underline-offset-2"
        >
          Open Today board
        </Link>
      ) : null}
    </div>
  );
}
