import { useMemo, useState } from "react";
import { useMarina } from "../../store/marina-store";
import type { LaunchTask } from "../../types/domain";
import { TaskRow } from "./task-row";

interface TaskListProps {
  date: string;
}

function sortByTime(tasks: LaunchTask[]): LaunchTask[] {
  return tasks.slice().sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

export function TaskList({ date }: TaskListProps) {
  const { state } = useMarina();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { launchTasks, liftTasks, otherTasks } = useMemo(() => {
    const dayTasks = state.launchTasks.filter((task) => task.date === date);
    const launch: LaunchTask[] = [];
    const lift: LaunchTask[] = [];
    const other: LaunchTask[] = [];

    for (const task of dayTasks) {
      const kind = state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind;
      if (kind === "retrieval") lift.push(task);
      else if (kind === "other") other.push(task);
      else launch.push(task);
    }

    return {
      launchTasks: sortByTime(launch),
      liftTasks: sortByTime(lift),
      otherTasks: sortByTime(other),
    };
  }, [date, state.launchTasks, state.taskTypes]);

  const rowCount = launchTasks.length + liftTasks.length + otherTasks.length;

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

  return (
    <div className="flex flex-col gap-6" data-task-list data-task-count={rowCount}>
      <p className="text-sm text-neutral-500">{rowCount} tasks</p>
      <TaskGroup
        title="Launch"
        tasks={launchTasks}
        openTaskId={openTaskId}
        errors={errors}
        onToggleOpen={onToggleOpen}
        onError={onError}
      />
      <TaskGroup
        title="Lift"
        tasks={liftTasks}
        openTaskId={openTaskId}
        errors={errors}
        onToggleOpen={onToggleOpen}
        onError={onError}
      />
      {otherTasks.length > 0 ? (
        <TaskGroup
          title="Other"
          tasks={otherTasks}
          openTaskId={openTaskId}
          errors={errors}
          onToggleOpen={onToggleOpen}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: LaunchTask[];
  openTaskId: string | null;
  errors: Record<string, string>;
  onToggleOpen: (taskId: string) => void;
  onError: (taskId: string, message: string | null) => void;
}

function TaskGroup({ title, tasks, openTaskId, errors, onToggleOpen, onError }: TaskGroupProps) {
  return (
    <section className="space-y-2" data-task-group={title.toLowerCase()}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-neutral-500">None.</p>
      ) : (
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
      )}
    </section>
  );
}
