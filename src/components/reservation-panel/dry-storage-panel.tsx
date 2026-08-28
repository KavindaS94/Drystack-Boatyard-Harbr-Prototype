import { LaunchLiftInvoice } from "./launch-lift-invoice";
import type { VesselStorageStatus } from "../../types/domain";
import { Badge } from "../ui/badge";

interface DryStoragePanelProps {
  reservationId: string;
  vesselId: string;
  storageStatus: VesselStorageStatus;
}

const STATUS_LABEL: Record<VesselStorageStatus, string> = {
  stored: "Stored",
  launched: "Launched",
  departed: "Departed",
};

const STATUS_TONE: Record<VesselStorageStatus, "neutral" | "success" | "warning"> = {
  stored: "neutral",
  launched: "success",
  departed: "warning",
};

export function DryStoragePanel({ reservationId, vesselId, storageStatus }: DryStoragePanelProps) {
  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <div>
        <p className="text-xs font-medium text-neutral-500">Status</p>
        <span className="mt-1 inline-block" data-storage-status={storageStatus}>
          <Badge tone={STATUS_TONE[storageStatus]}>{STATUS_LABEL[storageStatus]}</Badge>
        </span>
      </div>
      <LaunchLiftInvoice reservationId={reservationId} vesselId={vesselId} showLaunchBoardLink />
    </div>
  );
}
