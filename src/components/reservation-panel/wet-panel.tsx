import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useMarina } from "../../store/marina-store";
import { PlaceBookingModal } from "./place-booking-modal";
import { SendToYardModal } from "./send-to-yard-modal";

interface WetPanelProps {
  reservationId: string;
  boatyardLabel: string;
  dryStorageLabel: string;
  hasJob: boolean;
}

export function WetPanel({ reservationId, boatyardLabel, dryStorageLabel, hasJob }: WetPanelProps) {
  const { state, addAfloatJob } = useMarina();
  const [yardOpen, setYardOpen] = useState(false);
  const [dryOpen, setDryOpen] = useState(false);

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

      {state.settings.boatyardEnabled ? (
        <Button type="button" variant="harbr" onClick={() => setYardOpen(true)} className="w-full">
          Send to {boatyardLabel}
        </Button>
      ) : null}
      {state.settings.dryStorageEnabled ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setDryOpen(true)}
          data-send-to-dry
          className="w-full"
        >
          Send to {dryStorageLabel}
        </Button>
      ) : null}
      {yardOpen ? (
        <SendToYardModal
          reservationId={reservationId}
          boatyardLabel={boatyardLabel}
          onClose={() => setYardOpen(false)}
        />
      ) : null}
      {dryOpen ? (
        <PlaceBookingModal
          title={`Send to ${dryStorageLabel}`}
          sourceReservationId={reservationId}
          destKind="dry_storage"
          onClose={() => setDryOpen(false)}
        />
      ) : null}
    </div>
  );
}
