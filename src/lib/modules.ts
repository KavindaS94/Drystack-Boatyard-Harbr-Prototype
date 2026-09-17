import type { EquipmentKind, LandModule, Settings, SpaceKind, TaskModule } from "../types/domain";

export function isKindEnabled(kind: SpaceKind, settings: Settings): boolean {
  if (kind === "wet") return true;
  if (kind === "boatyard") return settings.boatyardEnabled;
  return settings.dryStorageEnabled;
}

export function enabledLandModules(settings: Settings): LandModule[] {
  const modules: LandModule[] = [];
  if (settings.dryStorageEnabled) modules.push("dry_storage");
  if (settings.boatyardEnabled) modules.push("boatyard");
  return modules;
}

export function isDryKind(kind: SpaceKind): boolean {
  return kind === "dry_storage";
}

export function isLandKind(kind: SpaceKind): boolean {
  return kind !== "wet";
}

export function spaceKindToModule(kind: SpaceKind): LandModule | null {
  if (kind === "wet") return null;
  return kind;
}

export function moduleLabel(module: TaskModule, settings: Settings): string {
  if (module === "boatyard") return settings.boatyardLabel;
  if (module === "dry_storage") return settings.dryStorageLabel;
  return "Other";
}

export function equipmentKindForModule(module: TaskModule): EquipmentKind | null {
  if (module === "boatyard") return "travel_lift";
  if (module === "dry_storage") return "fork_lift";
  return null;
}

export function usesForkLift(settings: Settings): boolean {
  return settings.dryStorageEnabled;
}

export function usesTravelLift(settings: Settings): boolean {
  return settings.boatyardEnabled;
}

export function enabledSpaceKinds(settings: Settings): SpaceKind[] {
  return (["wet", "boatyard", "dry_storage"] as const).filter((kind) => isKindEnabled(kind, settings));
}

export function modulePath(module: LandModule): string {
  if (module === "dry_storage") return "/operations/dry-stack";
  return "/operations/boatyard";
}

export function firstLandModulePath(settings: Settings): string {
  const land = enabledLandModules(settings);
  return land[0] ? modulePath(land[0]) : "/operations/calendar";
}

export function occupancyTabId(module: LandModule): "racks" | "yard" {
  return module === "dry_storage" ? "racks" : "yard";
}

export function occupancyTabLabel(module: LandModule): string {
  return module === "dry_storage" ? "Racks" : "Yard";
}

export function equipmentTabId(module: LandModule): "travel-lift" | "fork-lift" {
  return module === "boatyard" ? "travel-lift" : "fork-lift";
}

export function equipmentTabLabel(module: LandModule): string {
  return module === "boatyard" ? "Travel lift" : "Fork lift";
}
