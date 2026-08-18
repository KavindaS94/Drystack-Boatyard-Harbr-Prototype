import { useState } from "react";
import { useMarina } from "../../store/marina-store";
import { SendToYardModal } from "./send-to-yard-modal";

interface WetPanelProps {
  reservationId: string;
  boatyardLabel: string;
  hasJob: boolean;
}

export function WetPanel({ reservationId, boatyardLabel, hasJob }: WetPanelProps) {
  const { addAfloatJob } = useMarina();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      {!hasJob ? (
        <button
          type="button"
          onClick={() => addAfloatJob(reservationId)}
          data-add-afloat-job
          className="w-full rounded-md border border-primary/40 bg-primary-lighter px-3 py-2 text-sm font-medium text-primary hover:bg-primary-lighter/70"
        >
          Add afloat job
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
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
        <p className="mt-1.5 text-xs text-neutral-500">Use Send to … and choose Free berth</p>
      </div>
    </div>
  );
}
