import { CalendarIcon, MapPinIcon, ShipIcon, UserIcon, XIcon } from "lucide-react";
import { kindLabel } from "../../lib/labels";
import { useMarina } from "../../store/marina-store";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { DryStoragePanel } from "./dry-storage-panel";
import { JobPanel } from "./job-panel";
import { WetPanel } from "./wet-panel";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1 text-sm text-gray-900">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reservation</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ReservationPanel() {
  const { state, setSelectedReservationId } = useMarina();
  const reservation = state.reservations.find((item) => item.id === state.selectedReservationId);

  if (!state.selectedReservationId || !reservation) {
    return <EmptyState message="Click a booking bar" />;
  }

  const berth = state.berths.find((item) => item.id === reservation.berthId);
  const customer = state.customers.find((item) => item.id === reservation.customerId);
  const vessel = state.vessels.find((item) => item.id === reservation.vesselId);

  if (!berth || !customer || !vessel) {
    return <EmptyState message="Reservation is missing related records." />;
  }

  return (
    <div data-panel-kind={berth.kind}>
      {/* Header — vessel name + kind, mirrors Harbr ReservationHeader */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-gray-900">{vessel.name}</h2>
          <div className="mt-1">
            <Badge tone={berth.kind === "boatyard" ? "primary" : "neutral"}>
              {kindLabel(berth.kind, state.settings)}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedReservationId(null)}
          aria-label="Close"
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      {/* Info — lucide icon rows, mirrors Harbr ReservationInfo */}
      <div className="space-y-3 px-5 py-4">
        <InfoRow icon={<CalendarIcon className="size-5" />}>
          {formatDate(reservation.startDate)} – {formatDate(reservation.endDate)}
        </InfoRow>
        <InfoRow icon={<UserIcon className="size-5" />}>
          <span className="text-[hsl(252,75%,60%)]">{customer.name}</span>
        </InfoRow>
        <InfoRow icon={<ShipIcon className="size-5" />}>
          {vessel.name}
          <span className="ml-2 text-sm text-gray-500">
            {vessel.lengthM} × {vessel.beamM} m
          </span>
        </InfoRow>
        <InfoRow icon={<MapPinIcon className="size-5" />}>
          {berth.name}
          <span className="ml-2 text-sm text-gray-500">{berth.pier}</span>
        </InfoRow>
      </div>

      <div className="px-5 pb-5">
        {/* Job shows on a Hardstand (lifted) reservation, or on a Berth with afloat work. */}
        {(berth.kind === "boatyard" && state.settings.boatyardEnabled) || berth.kind === "wet" ? (
          <JobPanel reservationId={reservation.id} />
        ) : null}
        {berth.kind === "wet" ? (
          <WetPanel
            reservationId={reservation.id}
            boatyardLabel={state.settings.boatyardLabel}
            hasJob={Boolean(reservation.job)}
          />
        ) : null}
        {berth.kind === "dry_storage" ? (
          <DryStoragePanel vesselId={vessel.id} storageStatus={vessel.storageStatus} />
        ) : null}
      </div>
    </div>
  );
}
