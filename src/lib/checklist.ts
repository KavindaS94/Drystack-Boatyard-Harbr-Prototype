import type { JobPhoto } from "../types/domain";

export const DEFAULT_QA_PHOTOS = ["Lift-out photo taken", "Relaunch photo taken"];

export function itemsFromLabels(labels: string[]): { label: string; done: boolean }[] {
  return labels.map((label) => ({ label, done: false }));
}

export function photosFromLabels(labels: string[]): JobPhoto[] {
  return labels.map((label, index) => ({
    id: `photo-${index}-${slug(label)}`,
    label,
    done: false,
  }));
}

export function migrateJobPhoto(photo: unknown, index: number): JobPhoto {
  if (!photo || typeof photo !== "object") {
    return { id: `photo-${index}`, label: "Photo", done: false };
  }
  const item = photo as { id?: string; label?: string; done?: boolean; stage?: string };
  const label =
    item.label?.trim() ||
    (item.stage === "lift_out"
      ? "Lift-out photo taken"
      : item.stage === "relaunch"
        ? "Relaunch photo taken"
        : "Photo");
  return {
    id: item.id ?? `photo-${item.stage ?? index}`,
    label,
    done: Boolean(item.done),
  };
}

export function trimChecklist(labels: string[]): string[] {
  return labels.map((label) => label.trim()).filter(Boolean);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}
