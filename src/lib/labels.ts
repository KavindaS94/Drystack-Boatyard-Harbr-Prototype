import type { Settings, SpaceKind } from "../types/domain";

export function kindLabel(kind: SpaceKind, settings: Settings): string {
  if (kind === "wet") return "Berth";
  if (kind === "boatyard") return settings.boatyardLabel;
  if (kind === "hardstand") return settings.hardstandLabel;
  return settings.dryStorageLabel;
}
