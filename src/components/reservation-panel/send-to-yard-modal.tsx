import { PlaceBookingModal } from "./place-booking-modal";

interface SendToYardModalProps {
  reservationId: string;
  boatyardLabel: string;
  onClose: () => void;
}

export function SendToYardModal({ reservationId, boatyardLabel, onClose }: SendToYardModalProps) {
  return (
    <PlaceBookingModal
      title={`Send to ${boatyardLabel}`}
      sourceReservationId={reservationId}
      destKind="boatyard"
      onClose={onClose}
    />
  );
}
