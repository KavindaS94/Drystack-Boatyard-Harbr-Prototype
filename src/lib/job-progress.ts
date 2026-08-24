import type { Job } from "../types/domain";

/** Staff + portal labels for a yard job (Fenwick’s / plan Phase 4). */
export function jobProgressLabel(job: Job): string {
  if (job.status === "done") return "Done";
  if (job.tcStatus === "sent") return "Awaiting signature";

  const liftOut = job.photos.some((photo) => photo.stage === "lift_out" && photo.done);
  const relaunch = job.photos.some((photo) => photo.stage === "relaunch" && photo.done);
  const checksDone = job.checklist.filter((item) => item.done).length;
  const checksTotal = job.checklist.length;

  if (relaunch || (liftOut && checksTotal > 0 && checksDone === checksTotal)) {
    return "Ready to launch";
  }
  if (liftOut) return "Lifted";
  if (checksDone > 0 || job.hours.length > 0 || job.materials.length > 0) return "In progress";
  return "Booked";
}
