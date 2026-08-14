import type { Settings, SpaceKind } from "../types/domain";

export function kindLabel(kind: SpaceKind, settings: Settings): string {
  if (kind === "wet") return "Wet berth";
  if (kind === "boatyard") return settings.boatyardLabel;
  return settings.dryStorageLabel;
}
