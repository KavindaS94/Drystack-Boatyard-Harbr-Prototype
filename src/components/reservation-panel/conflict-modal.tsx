import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { formatIsoDate, type BerthConflictDetails } from "../../lib/availability";

interface ConflictModalProps {
  conflict: BerthConflictDetails;
  onClose: () => void;
  onViewCalendar: () => void;
}

export function ConflictModal({ conflict, onClose, onViewCalendar }: ConflictModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-title"
        data-conflict-modal
        className="w-full max-w-md rounded-lg border border-[hsl(0,80%,70%)] bg-white p-4 shadow-lg"
      >
        <h2
          id="conflict-title"
          className="flex items-center gap-2 text-base font-semibold text-[hsl(0,80%,60%)]"
        >
          <AlertTriangle className="h-5 w-5" />
          Reservation Conflict
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          There is already a reservation for berth {conflict.berthName} during the selected period.
        </p>

        <div className="space-y-2 py-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Berth:</span>{" "}
            <span className="text-gray-700">{conflict.berthName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Start Date:</span>{" "}
            <span className="text-gray-700">{formatIsoDate(conflict.startDate)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">End Date:</span>{" "}
            <span className="text-gray-700">{formatIsoDate(conflict.endDate)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-lg border border-[hsl(0,80%,70%)] bg-white px-6 font-medium text-[hsl(0,80%,60%)] transition-colors hover:bg-[hsl(0,80%,95%)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onViewCalendar}
            data-conflict-view-calendar
            className="h-12 flex-1 rounded-lg bg-[hsl(0,80%,60%)] px-6 font-medium text-white transition-colors hover:bg-[hsl(0,80%,50%)]"
          >
            View Calendar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
