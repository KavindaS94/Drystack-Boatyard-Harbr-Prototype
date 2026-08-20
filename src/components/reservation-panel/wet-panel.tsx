import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
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
        <Button
          type="button"
          variant="harbrSecondary"
          onClick={() => {
            addAfloatJob(reservationId);
            toast.success("Afloat job added");
          }}
          data-add-afloat-job
          className="w-full"
        >
          Add afloat job
        </Button>
      ) : null}

      <Button type="button" variant="harbr" onClick={() => setIsModalOpen(true)} className="w-full">
        Send to {boatyardLabel}
      </Button>
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
