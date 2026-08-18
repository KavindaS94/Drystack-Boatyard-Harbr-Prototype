import { useEffect, useState } from "react";
import { AddTaskModal } from "../components/launch/add-task-modal";
import { TaskList } from "../components/launch/task-list";
import { useMarina } from "../store/marina-store";

const DEFAULT_BOARD_DATE = "2026-08-15";

export function LaunchBoardScreen() {
  const { state, setSelectedDate } = useMarina();
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    setSelectedDate(DEFAULT_BOARD_DATE);
  }, [setSelectedDate]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" data-launch-board>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Launch board</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium text-neutral-500">Date</span>
            <input
              type="date"
              value={state.selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              data-launch-date
              className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            data-add-task
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Add task
          </button>
        </div>
      </div>

      <TaskList date={state.selectedDate} />

      {isAddOpen ? <AddTaskModal date={state.selectedDate} onClose={() => setIsAddOpen(false)} /> : null}
    </div>
  );
}
