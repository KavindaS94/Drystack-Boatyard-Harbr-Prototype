import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dnlStatus } from "../../lib/dnl";
import { enabledLandModules, moduleLabel } from "../../lib/modules";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask, TaskModule } from "../../types/domain";
import { DnlBadge } from "../dnl-badge";
import { Button } from "../ui/button";
import { TaskRow } from "./task-row";

type BoardTab = "requests" | "launch" | "lift";

interface TaskListProps {
  date: string;
  module: TaskModule;
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

export function TaskList({ date, module }: TaskListProps) {
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
    const dayTasks = state.launchTasks.filter((task) => {
      if (task.date !== date) return false;
      if (module === "other") return task.module === "other" || state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind === "other";
      return task.module === module;
    });
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
  }, [date, module, state.launchTasks, state.taskTypes]);

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
    const ok = approveRequest(taskId);
    if (!ok) {
      toast.error("Could not approve — slot is no longer free");
      return;
    }
    toast.success("Request approved — customer emailed");
    setTabOverride(kind === "retrieval" ? "lift" : "launch");
  }

  function onDecline(taskId: string) {
    const reason = window.prompt("Decline reason (shown to customer)", "No lift slot available");
    if (!reason) return;
    declineRequest(taskId, reason);
    toast.message("Request declined — customer emailed");
  }

  if (module === "other") {
    return (
      <div className="flex flex-col gap-6" data-task-list data-task-count={rowCount} data-board-tab="other">
        <KindSection
          empty="No other tasks today."
          tasks={[...other, ...launches, ...lifts]}
          testId="other-needed"
          openTaskId={openTaskId}
          errors={errors}
          onToggleOpen={onToggleOpen}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-task-list data-task-count={rowCount} data-board-tab={tab}>
      <div className="space-y-4">
        <div
          className="inline-flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1"
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
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
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
            empty={`No launches today in ${moduleLabel(module, state.settings)}.`}
            tasks={launches}
            testId="launch-needed"
            openTaskId={openTaskId}
            errors={errors}
            onToggleOpen={onToggleOpen}
            onError={onError}
          />
        ) : (
          <KindSection
            empty={`No lifts today in ${moduleLabel(module, state.settings)}.`}
            tasks={lifts}
            testId="lift-needed"
            openTaskId={openTaskId}
            errors={errors}
            onToggleOpen={onToggleOpen}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}

export function ModuleTabs({
  module,
  onChange,
}: {
  module: TaskModule;
  onChange: (module: TaskModule) => void;
}) {
  const { state } = useMarina();
  const land = enabledLandModules(state.settings);
  const tabs: TaskModule[] = [...land, "other"];
  if (land.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1" role="tablist" aria-label="Storage module">
      {tabs.map((item) => {
        const selected = module === item;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={selected}
            data-module-tab={item}
            onClick={() => onChange(item)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              selected ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {moduleLabel(item, state.settings)}
          </button>
        );
      })}
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
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
          No customer requests today. Use Log request when someone phones or emails.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" data-customer-requests data-kind-section="customer-requests">
      <ul className="flex flex-col gap-3">
        {requests.map((task) => {
          const taskType = state.taskTypes.find((item) => item.id === task.taskTypeId);
          const customer = state.customers.find((item) => item.id === task.customerId);
          const vessel = state.vessels.find((item) => item.id === task.vesselId);
          const berth = state.berths.find((item) => item.id === task.berthId);
          const dnl =
            vessel && customer
              ? dnlStatus(vessel, customer, state.settings)
              : { blocked: false, reasons: [] as string[] };
          return (
            <li
              key={task.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              data-request-task={task.id}
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="w-[4.5rem] shrink-0">
                  <p className="text-2xl font-semibold tabular-nums leading-none text-neutral-900">{task.time}</p>
                  <p className="mt-1.5 text-xs font-medium text-neutral-500">{taskType?.name ?? "Task"}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-neutral-900">{vessel?.name ?? "Boat"}</p>
                    <DnlBadge status={dnl} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {customer?.name}
                    {berth ? (
                      <>
                        <span className="mx-2 text-neutral-300">·</span>
                        <span className="font-medium text-neutral-800">{berth.name}</span>
                      </>
                    ) : null}
                  </p>
                </div>
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
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map(([time, groupTasks]) => (
            <div key={time} className="space-y-3" data-time-group={time}>
              <ul className="flex flex-col gap-3">
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
