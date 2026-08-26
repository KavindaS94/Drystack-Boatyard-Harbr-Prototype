import type { Job, JobPhoto } from "../types/domain";

function photoMatches(photo: JobPhoto, kind: "lift_out" | "relaunch"): boolean {
  const label = photo.label.toLowerCase();
  if (kind === "lift_out") return /lift-out|lift out/.test(label);
  return /relaunch/.test(label);
}

function photoDone(photos: JobPhoto[], kind: "lift_out" | "relaunch", fallbackIndex: number): boolean {
  const named = photos.find((photo) => photoMatches(photo, kind));
  if (named) return named.done;
  return Boolean(photos[fallbackIndex]?.done);
}

/** Staff + portal labels for a yard job (Fenwick’s / plan Phase 4). */
export function jobProgressLabel(job: Job): string {
  if (job.status === "done") return "Done";
  if (job.tcStatus === "sent") return "Awaiting signature";

  const liftOut = photoDone(job.photos, "lift_out", 0);
  const relaunch = photoDone(job.photos, "relaunch", Math.max(0, job.photos.length - 1));
  const checksDone = job.checklist.filter((item) => item.done).length;
  const checksTotal = job.checklist.length;
  const allPhotos = job.photos.length > 0 && job.photos.every((photo) => photo.done);

  if (relaunch || allPhotos || (liftOut && checksTotal > 0 && checksDone === checksTotal)) {
    return "Ready to launch";
  }
  if (liftOut) return "Lifted";
  if (checksDone > 0 || job.hours.length > 0 || job.materials.length > 0) return "In progress";
  return "Booked";
}
