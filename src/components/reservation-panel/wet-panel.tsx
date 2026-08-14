import { useState } from "react";
import { SendToYardModal } from "./send-to-yard-modal";

interface WetPanelProps {
  reservationId: string;
  boatyardLabel: string;
}

export function WetPanel({ reservationId, boatyardLabel }: WetPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Send to {boatyardLabel}
      </button>
      {isModalOpen ? (
        <SendToYardModal
          reservationId={reservationId}
          boatyardLabel={boatyardLabel}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
      <div>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-400"
        >
          Move
        </button>
        <p className="mt-1.5 text-xs text-neutral-500">Use Send to … and choose Free wet berth</p>
      </div>
    </div>
  );
}
