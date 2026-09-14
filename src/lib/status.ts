import type { SpaceKind, VesselStorageStatus } from "../types/domain";
import { isDryKind } from "./modules";

/** Dry stack / hardstand: the boat sits on its space only while stored. */
export function occupiesDryRack(status: VesselStorageStatus): boolean {
  return status === "stored";
}

export function occupiesDrySpace(kind: SpaceKind, status: VesselStorageStatus): boolean {
  return isDryKind(kind) && occupiesDryRack(status);
}

export function canSetStorageStatus(
  current: VesselStorageStatus,
  next: VesselStorageStatus
): boolean {
  if (current === "stored" && next === "launched") return true;
  if (current === "launched" && next === "departed") return true;
  if (current === "launched" && next === "stored") return true;
  if (current === "departed" && next === "stored") return true;
  return false;
}

export function statusAfterTaskDone(
  kind: "launch" | "retrieval" | "other",
  current: VesselStorageStatus
): VesselStorageStatus | null {
  if (kind === "launch" && current === "stored") return "launched";
  if (kind === "retrieval" && (current === "launched" || current === "departed")) {
    return "stored";
  }
  return null;
}
