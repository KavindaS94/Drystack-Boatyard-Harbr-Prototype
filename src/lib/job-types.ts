import type { JobType } from "../types/domain";

export function isLiftJobType(jobType: Pick<JobType, "id" | "name">): boolean {
  return jobType.id === "jt-travel-lift" || jobType.name.trim().toLowerCase() === "travel lift";
}

export function workJobTypes(jobTypes: JobType[]): JobType[] {
  return jobTypes.filter((item) => !isLiftJobType(item));
}

export function remapTravelLiftJobTypeId(typeId: string): string {
  return typeId === "jt-travel-lift" ? "jt-engine" : typeId;
}

export function isLegacyTravelLiftChecklist(checklist: { label: string }[]): boolean {
  const labels = new Set(checklist.map((item) => item.label));
  return labels.has("Path clear") && labels.has("Straps checked") && labels.has("Lift complete");
}
