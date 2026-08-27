import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dnlStatus } from "../../lib/dnl";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask } from "../../types/domain";
import { DnlBadge } from "../dnl-badge";
import { Button } from "../ui/button";
import { TaskRow } from "./task-row";

type BoardTab = "requests" | "launch" | "lift";

interface TaskListProps {
  date: string;
}

function sortByTime(tasks: LaunchTask[]): LaunchTask[] {
  return tasks.slice().sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

function groupByTime(tasks: LaunchTask[]): [string, LaunchTask[]][] {
  const byTime = new Map<string, LaunchTask[]>();
  for (const task of sortByTime(tasks)) {
    const group = byTime.get(task.time) ?? [];
    group.push(task);
    byTime.set(task.time, group);
  }
  return [...byTime.entries()];
}

export function TaskList({ date }: TaskListProps) {
  const { state, approveRequest, declineRequest } = useMarina();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tabOverride, setTabOverride] = useState<BoardTab | null>(null);
  const [tabDate, setTabDate] = useState(date);
  if (tabDate !== date) {
    setTabDate(date);
    setTabOverride(null);
  }

  const { requests, lifts, launches, other, totals } = useMemo(() => {
    const dayTasks = state.launchTasks.filter((task) => task.date === date);
    const requested: LaunchTask[] = [];
    const liftTasks: LaunchTask[] = [];
    const launchTasks: LaunchTask[] = [];
    const otherTasks: LaunchTask[] = [];

    for (const task of dayTasks) {
      if (task.status === "requested") {
        requested.push(task);
        continue;
      }
      if (task.status === "declined") continue;
      const kind = state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind;
      if (kind === "retrieval") liftTasks.push(task);
      else if (kind === "launch") launchTasks.push(task);
      else otherTasks.push(task);
    }

    return {
      requests: sortByTime(requested),
      lifts: liftTasks,
      launches: launchTasks,
      other: otherTasks,
      totals: {
        requests: requested.length,
        launches: launchTasks.length,
        lifts: liftTasks.length,
      },
    };
  }, [date, state.launchTasks, state.taskTypes]);

  const tab: BoardTab =
    tabOverride ??
    (requests.length > 0 ? "requests" : launches.length === 0 && lifts.length > 0 ? "lift" : "launch");
  const rowCount = requests.length + lifts.length + launches.length + other.length;

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
    const task = state.launchTasks.find((item) => item.id === taskId);
    const kind = state.taskTypes.find((item) => item.id === task?.taskTypeId)?.kind;
    approveRequest(taskId);
    toast.success("Request approved — customer notified");
    setTabOverride(kind === "retrieval" ? "lift" : "launch");
  }

  function onDecline(taskId: string) {
    const reason = window.prompt("Decline reason (shown to customer)", "No travel-lift slot available");
    if (!reason) return;
    declineRequest(taskId, reason);
    toast.message("Request declined");
  }

  return (
    <div className="flex flex-col gap-6" data-task-list data-task-count={rowCount} data-board-tab={tab}>
      <div className="space-y-4">
        <div
          className="grid grid-cols-3 gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1"
          role="tablist"
          aria-label="Requests, launch, or lift"
        >
          {(
            [
              { id: "requests" as const, label: "Requests", count: totals.requests, selectedClass: "text-amber-800", badgeClass: "bg-amber-100 text-amber-900" },
              { id: "launch" as const, label: "Launch", count: totals.launches, selectedClass: "text-[hsl(252,75%,40%)]", badgeClass: "bg-[hsl(252,75%,94%)] text-[hsl(252,75%,32%)]" },
              { id: "lift" as const, label: "Lift", count: totals.lifts, selectedClass: "text-teal-800", badgeClass: "bg-teal-100 text-teal-900" },
            ] as const
          ).map((item) => {
            const selected = tab === item.id;
            const recordLabel = item.count === 1 ? "record" : "records";
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${item.label}, ${item.count} ${recordLabel}`}
                data-board-tab-button={item.id}
                onClick={() => setTabOverride(item.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium sm:gap-2 sm:px-3",
                  selected ? `bg-white shadow-sm ${item.selectedClass}` : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                {item.label}
                <span
                  data-tab-count={item.id}
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    selected ? item.badgeClass : "bg-neutral-200 text-neutral-700"
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "requests" ? (
          <RequestsSection requests={requests} onApprove={onApprove} onDecline={onDecline} />
        ) : tab === "launch" ? (
          <KindSection
            empty="No launches today."
            tasks={launches}
            testId="launch-needed"
            openTaskId={openTaskId}
            errors={errors}
            onToggleOpen={onToggleOpen}
            onError={onError}
          />
        ) : (
          <KindSection
            empty="No lifts today."
            tasks={lifts}
            testId="lift-needed"
            openTaskId={openTaskId}
            errors={errors}
            onToggleOpen={onToggleOpen}
            onError={onError}
          />
        )}

        {other.length > 0 && tab !== "requests" ? (
          <KindSection
            title="Other"
            empty="None."
            tasks={other}
            testId="other-needed"
            openTaskId={openTaskId}
            errors={errors}
            onToggleOpen={onToggleOpen}
            onError={onError}
          />
        ) : null}
      </div>
    </div>
  );
}

function RequestsSection({
  requests,
  onApprove,
  onDecline,
}: {
  requests: LaunchTask[];
  onApprove: (taskId: string) => void;
  onDecline: (taskId: string) => void;
}) {
  const { state } = useMarina();

  if (requests.length === 0) {
    return (
      <section className="space-y-3" data-customer-requests data-kind-section="customer-requests">
        <p className="text-sm text-neutral-500">No customer requests today.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3" data-customer-requests data-kind-section="customer-requests">
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
  );
}

function KindSection({
  title,
  empty,
  tasks,
  testId,
  openTaskId,
  errors,
  onToggleOpen,
  onError,
}: {
  title?: string;
  empty: string;
  tasks: LaunchTask[];
  testId: string;
  openTaskId: string | null;
  errors: Record<string, string>;
  onToggleOpen: (taskId: string) => void;
  onError: (taskId: string, message: string | null) => void;
}) {
  const groups = groupByTime(tasks);

  return (
    <section className="space-y-3" data-kind-section={testId}>
      {title ? (
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      ) : null}
      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        <div className="space-y-4">
          {groups.map(([time, groupTasks]) => (
            <div key={time} className="space-y-2" data-time-group={time}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{time}</h3>
              <ul className="flex flex-col gap-2">
                {groupTasks.map((task) => (
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
