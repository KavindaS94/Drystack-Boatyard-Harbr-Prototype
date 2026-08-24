import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dnlStatus } from "../../lib/dnl";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask } from "../../types/domain";
import { DnlBadge } from "../dnl-badge";
import { Button } from "../ui/button";
import { TaskRow } from "./task-row";

interface TaskListProps {
  date: string;
}

function sortByTime(tasks: LaunchTask[]): LaunchTask[] {
  return tasks.slice().sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

export function TaskList({ date }: TaskListProps) {
  const { state, approveRequest, declineRequest } = useMarina();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { requests, runSheet, totals } = useMemo(() => {
    const dayTasks = state.launchTasks.filter((task) => task.date === date);
    const requested: LaunchTask[] = [];
    const scheduled: LaunchTask[] = [];
    let launches = 0;
    let lifts = 0;

    for (const task of dayTasks) {
      if (task.status === "requested") {
        requested.push(task);
        continue;
      }
      if (task.status === "declined") continue;
      scheduled.push(task);
      const kind = state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind;
      if (kind === "retrieval") lifts += 1;
      else if (kind !== "other") launches += 1;
    }

    const byTime = new Map<string, LaunchTask[]>();
    for (const task of sortByTime(scheduled)) {
      const group = byTime.get(task.time) ?? [];
      group.push(task);
      byTime.set(task.time, group);
    }

    return {
      requests: sortByTime(requested),
      runSheet: [...byTime.entries()],
      totals: {
        launches,
        lifts,
        requested: requested.length,
      },
    };
  }, [date, state.launchTasks, state.taskTypes]);

  const rowCount = runSheet.reduce((sum, [, tasks]) => sum + tasks.length, 0);

  function onToggleOpen(taskId: string) {
    setOpenTaskId((current) => (current === taskId ? null : taskId));
  }

  function onError(taskId: string, message: string | null) {
    setErrors((current) => {
      if (!message) {
        const next = { ...current };
        delete next[taskId];
        return next;
      }
      return { ...current, [taskId]: message };
    });
  }

  function onApprove(taskId: string) {
    approveRequest(taskId);
    toast.success("Request approved — customer notified");
  }

  function onDecline(taskId: string) {
    const reason = window.prompt("Decline reason (shown to customer)", "No travel-lift slot available");
    if (!reason) return;
    declineRequest(taskId, reason);
    toast.message("Request declined");
  }

  return (
    <div className="flex flex-col gap-6" data-task-list data-task-count={rowCount}>
      <p className="text-sm text-neutral-500" data-run-sheet-totals>
        {totals.launches} launches · {totals.lifts} lifts
        {totals.requested > 0 ? ` · ${totals.requested} customer requests` : ""}
      </p>

      {requests.length > 0 ? (
        <section className="space-y-2" data-customer-requests>
          <h2 className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Customer requests
          </h2>
          <ul className="flex flex-col gap-2">
            {requests.map((task) => {
              const taskType = state.taskTypes.find((item) => item.id === task.taskTypeId);
              const customer = state.customers.find((item) => item.id === task.customerId);
              const vessel = state.vessels.find((item) => item.id === task.vesselId);
              const dnl =
                vessel && customer
                  ? dnlStatus(vessel, customer, state.settings)
                  : { blocked: false, reasons: [] as string[] };
              return (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3"
                  data-request-task={task.id}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-800">
                    <span className="font-semibold tabular-nums">{task.time}</span>
                    <span>
                      {taskType?.name ?? "Task"} · {customer?.name} · {vessel?.name}
                    </span>
                    <DnlBadge status={dnl} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onDecline(task.id)}>
                      Decline
                    </Button>
                    <Button type="button" size="sm" variant="harbr" onClick={() => onApprove(task.id)}>
                      Approve
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {runSheet.length === 0 ? (
        <p className="text-sm text-neutral-500">No scheduled launches or lifts.</p>
      ) : (
        <div className="space-y-4" data-run-sheet>
          {runSheet.map(([time, tasks]) => (
            <section key={time} className="space-y-2" data-time-group={time}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{time}</h2>
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      isOpen={openTaskId === task.id}
                      error={errors[task.id]}
                      onToggleOpen={() => onToggleOpen(task.id)}
                      onError={(message) => onError(task.id, message)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
