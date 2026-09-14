import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { formatIsoDate } from "../../lib/availability";
import type { EquipmentConflictDetails } from "../../lib/equipment";

interface EquipmentConflictModalProps {
  conflict: EquipmentConflictDetails;
  onClose: () => void;
}

export function EquipmentConflictModal({ conflict, onClose }: EquipmentConflictModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-conflict-title"
        data-equipment-conflict-modal
        className="w-full max-w-md rounded-lg border border-[hsl(0,80%,70%)] bg-white p-4 shadow-lg"
      >
        <h2
          id="equipment-conflict-title"
          className="flex items-center gap-2 text-base font-semibold text-[hsl(0,80%,60%)]"
        >
          <AlertTriangle className="h-5 w-5" />
          Lift slot taken
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {conflict.equipmentName} already has a boat at {conflict.startTime} on {formatIsoDate(conflict.date)}. One
          vessel per slot.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-lg border border-[hsl(0,80%,70%)] bg-white px-6 font-medium text-[hsl(0,80%,60%)] hover:bg-[hsl(0,80%,95%)]"
          >
            Pick another time
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
