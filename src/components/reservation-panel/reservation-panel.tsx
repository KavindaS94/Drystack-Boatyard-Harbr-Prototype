import { useMarina } from "../../store/marina-store";
import { DryStoragePanel } from "./dry-storage-panel";
import { JobPanel } from "./job-panel";
import { WetPanel } from "./wet-panel";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

export function ReservationPanel() {
  const { state, setSelectedReservationId } = useMarina();
  const reservation = state.reservations.find((item) => item.id === state.selectedReservationId);

  if (!state.selectedReservationId || !reservation) {
    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Reservation</p>
        <p className="mt-2 text-sm text-neutral-500">Click a booking bar</p>
      </>
    );
  }

  const berth = state.berths.find((item) => item.id === reservation.berthId);
  const customer = state.customers.find((item) => item.id === reservation.customerId);
  const vessel = state.vessels.find((item) => item.id === reservation.vesselId);

  if (!berth || !customer || !vessel) {
    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Reservation</p>
        <p className="mt-2 text-sm text-neutral-500">Reservation is missing related records.</p>
      </>
    );
  }

  return (
    <div className="space-y-4" data-panel-kind={berth.kind}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Reservation</p>
        <button
          type="button"
          onClick={() => setSelectedReservationId(null)}
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          Close
        </button>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-neutral-500">Customer</dt>
          <dd className="text-neutral-900">{customer.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Vessel</dt>
          <dd className="text-neutral-900">{vessel.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Dates</dt>
          <dd className="text-neutral-900">
            {formatDate(reservation.startDate)} – {formatDate(reservation.endDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Berth</dt>
          <dd className="text-neutral-900">{berth.name}</dd>
        </div>
      </dl>

      {berth.kind === "wet" ? (
        <WetPanel reservationId={reservation.id} boatyardLabel={state.settings.boatyardLabel} />
      ) : null}
      {berth.kind === "boatyard" ? <JobPanel reservationId={reservation.id} /> : null}
      {berth.kind === "dry_storage" ? (
        <DryStoragePanel vesselId={vessel.id} storageStatus={vessel.storageStatus} />
      ) : null}
    </div>
  );
}
