import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AddTaskModal } from "../components/launch/add-task-modal";
import { ModuleTabs, TaskList } from "../components/launch/task-list";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { enabledLandModules } from "../lib/modules";
import { useMarina } from "../store/marina-store";
import type { TaskModule } from "../types/domain";

export function LaunchBoardScreen() {
  const { state, setSelectedDate } = useMarina();
  const [params] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [asRequest, setAsRequest] = useState(false);
  const land = enabledLandModules(state.settings);
  const modules: TaskModule[] = useMemo(() => [...land, "other"], [land]);
  const [module, setModule] = useState<TaskModule>(modules[0] ?? "other");
  const pending = state.launchTasks.filter((task) => task.status === "requested").length;
  const script = params.get("script");

  useEffect(() => {
    if (script === "saturday") {
      setSelectedDate(DEMO_SATURDAY);
    } else if (script === "rack") {
      setSelectedDate(DEMO_FRIDAY);
    }
  }, [script, setSelectedDate]);

  useEffect(() => {
    if (!modules.includes(module)) setModule(modules[0] ?? "other");
  }, [module, modules]);

  if (land.length === 0) {
    return (
      <div className="p-6 text-sm text-neutral-600">
        Turn on Dry stack, Boatyard, or Hardstand in Settings to use the Launch board.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6" data-launch-board>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Launch board</h1>
          {pending > 0 ? (
            <p className="mt-0.5 text-sm text-amber-700" data-pending-count>
              {pending} customer request{pending === 1 ? "" : "s"} waiting
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium text-neutral-500">Date</span>
            <Input
              type="date"
              value={state.selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              data-launch-date
              className="h-8 w-auto"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAsRequest(true);
              setIsAddOpen(true);
            }}
            data-log-request
          >
            Log request
          </Button>
          <Button
            type="button"
            variant="harbr"
            size="sm"
            onClick={() => {
              setAsRequest(false);
              setIsAddOpen(true);
            }}
            data-add-task
          >
            Add task
          </Button>
        </div>
      </div>

      <ModuleTabs module={module} onChange={setModule} />
      <TaskList date={state.selectedDate} module={module} />

      {isAddOpen ? (
        <AddTaskModal
          date={state.selectedDate}
          module={module}
          asRequest={asRequest}
          onClose={() => setIsAddOpen(false)}
        />
      ) : null}
    </div>
  );
}
