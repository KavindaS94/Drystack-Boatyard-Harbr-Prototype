import type { ChecklistItem, ChecklistOption, JobPhoto } from "../types/domain";

export const DEFAULT_QA_PHOTOS: ChecklistOption[] = [
  { label: "Lift-out photo taken", category: "QA photo" },
  { label: "Relaunch photo taken", category: "QA photo" },
];

export const DEFAULT_CHECKLIST_CATEGORIES = ["Yard job", "QA photo", "Launch", "Lift", "Safety", "Prep"];

export function migrateChecklistOption(value: unknown, fallbackCategory: string): ChecklistOption {
  if (typeof value === "string") {
    return { label: value, category: fallbackCategory };
  }
  if (value && typeof value === "object") {
    const item = value as { label?: string; category?: string };
    const label = typeof item.label === "string" ? item.label : "";
    const category = typeof item.category === "string" && item.category.trim() ? item.category : fallbackCategory;
    return { label, category };
  }
  return { label: "", category: fallbackCategory };
}

export function migrateChecklistOptions(value: unknown, fallbackCategory: string): ChecklistOption[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => migrateChecklistOption(item, fallbackCategory)).filter((item) => item.label.trim());
}

export function itemsFromOptions(
  options: Array<string | ChecklistOption>,
  fallbackCategory = ""
): ChecklistItem[] {
  return options.map((item) => {
    const option = migrateChecklistOption(item, fallbackCategory);
    return { label: option.label, category: option.category, done: false };
  });
}

export function photosFromOptions(
  options: Array<string | ChecklistOption>,
  fallbackCategory = "QA photo"
): JobPhoto[] {
  return options.map((item, index) => {
    const option = migrateChecklistOption(item, fallbackCategory);
    return {
      id: `photo-${index}-${slug(option.label)}`,
      label: option.label,
      category: option.category,
      done: false,
    };
  });
}

export function migrateJobPhoto(photo: unknown, index: number): JobPhoto {
  if (!photo || typeof photo !== "object") {
    return { id: `photo-${index}`, label: "Photo", category: "QA photo", done: false };
  }
  const item = photo as { id?: string; label?: string; category?: string; done?: boolean; stage?: string };
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
    category: item.category?.trim() || "QA photo",
    done: Boolean(item.done),
  };
}

export function migrateChecklistItem(value: unknown, fallbackCategory: string): ChecklistItem {
  if (value && typeof value === "object" && "done" in (value as object)) {
    const item = value as { label?: string; category?: string; done?: boolean };
    const option = migrateChecklistOption(item, fallbackCategory);
    return { ...option, done: Boolean(item.done) };
  }
  const option = migrateChecklistOption(value, fallbackCategory);
  return { ...option, done: false };
}

export function trimChecklistOptions(items: ChecklistOption[]): ChecklistOption[] {
  return items
    .map((item) => ({ label: item.label.trim(), category: item.category.trim() }))
    .filter((item) => item.label);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}
