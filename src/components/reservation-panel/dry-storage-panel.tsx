import { Link } from "react-router-dom";
import { useMarina } from "../../store/marina-store";
import type { VesselStorageStatus } from "../../types/domain";

interface DryStoragePanelProps {
  vesselId: string;
  storageStatus: VesselStorageStatus;
}

const STATUS_LABEL: Record<VesselStorageStatus, string> = {
  stored: "Stored",
  launched: "Launched",
  departed: "Departed",
};

export function DryStoragePanel({ vesselId, storageStatus }: DryStoragePanelProps) {
  const { state } = useMarina();
  const tasks = state.launchTasks
    .filter((task) => task.vesselId === vesselId && task.date >= state.selectedDate)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <div>
        <p className="text-xs font-medium text-neutral-500">Status</p>
        <p className="text-sm font-medium text-neutral-900" data-storage-status={storageStatus}>
          {STATUS_LABEL[storageStatus]}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500">Launch tasks</p>
        {tasks.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">None on or after this date.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {tasks.map((task) => {
              const taskType = state.taskTypes.find((item) => item.id === task.taskTypeId);
              return (
                <li key={task.id} className="text-sm text-neutral-800">
                  {task.time} · {taskType?.name ?? task.taskTypeId} · {task.status === "done" ? "Done" : "Open"}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link to="/launch-board" className="inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">
        Open launch board
      </Link>
    </div>
  );
}
