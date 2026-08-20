import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Key,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Ship,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { kindLabel } from "../../lib/labels";
import {
  agreementPrimaryLabel,
  archiveBlockReason,
  canEditOrMove,
  moveBlockReason,
  RESERVATION_STATUS_COLOR,
  RESERVATION_STATUS_LABEL,
  showsViewAgreementLink,
} from "../../lib/reservation-footer";
import { useMarina } from "../../store/marina-store";
import type { Reservation, ReservationStatus } from "../../types/domain";
import { DryStoragePanel } from "./dry-storage-panel";
import { JobPanel } from "./job-panel";
import { WetPanel } from "./wet-panel";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const notesByReservation = new Map<string, string>();

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

function daysInclusive(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function durationLabel(start: string, end: string): string {
  const days = daysInclusive(start, end);
  if (days <= 0) return "";
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  if (weeks > 0 && remainder > 0) {
    return `For ${weeks} week${weeks === 1 ? "" : "s"} and ${remainder} day${remainder === 1 ? "" : "s"}`;
  }
  if (weeks > 0) return `For ${weeks} week${weeks === 1 ? "" : "s"}`;
  return `For ${days} day${days === 1 ? "" : "s"}`;
}

function emailFor(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  return `${slug}@harbour.demo`;
}

function phoneFor(id: string): string {
  const n = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `+61 4${String(10 + (n % 90)).padStart(2, "0")} ${String(100 + (n % 900)).padStart(3, "0")} ${String(100 + ((n * 3) % 900)).padStart(3, "0")}`;
}

function statusForReservation(status: ReservationStatus): { label: string; color: string } {
  return { label: RESERVATION_STATUS_LABEL[status], color: RESERVATION_STATUS_COLOR[status] };
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1 break-all text-sm text-gray-900">{children}</div>
    </div>
  );
}

function inert(label: string) {
  toast.message("Not in this prototype", { description: label });
}

function NotesBlock({ reservationId }: { reservationId: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notesByReservation.get(reservationId) ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(notesByReservation.get(reservationId) ?? "");
    setSaved(false);
    setOpen(false);
  }, [reservationId]);

  const preview = value.trim() || "No notes yet — expand to add notes";

  function save() {
    notesByReservation.set(reservationId, value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/80">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-100/80"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-foreground text-sm">Reservation related notes</div>
            {open && saved ? <span className="text-emerald-600 text-xs">Saved</span> : null}
          </div>
          {!open ? (
            <p className="mt-0.5 line-clamp-2 break-words text-muted-foreground text-xs">{preview}</p>
          ) : null}
        </div>
      </button>
      {open ? (
        <div className="min-w-0 border-gray-200 border-t bg-white px-3 py-3">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={save}
            placeholder="Add marina manager notes for this reservation..."
            rows={3}
            className="min-h-[88px] w-full resize-y rounded-md border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">Changes also save when you click away from the field.</p>
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={save}>
              Save
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FooterActions({ reservation }: { reservation: Reservation }) {
  const { archiveReservation, setReservationStatus } = useMarina();
  const [agreementOpen, setAgreementOpen] = useState(false);
  const status = reservation.status;
  const primaryLabel = agreementPrimaryLabel(status);
  const showViewLink = showsViewAgreementLink(status);
  const showEditMove = canEditOrMove(status);
  const archiveReason = archiveBlockReason(status, reservation.job);
  const moveReason = moveBlockReason(status);

  function onArchive() {
    if (archiveReason) {
      toast.error(archiveReason);
      return;
    }
    if (!window.confirm("Archive this reservation? It will leave the calendar.")) return;
    archiveReservation(reservation.id);
    toast.success("Reservation archived");
  }

  function onApprove() {
    setReservationStatus(reservation.id, "approved");
    setAgreementOpen(false);
    toast.success("Reservation approved");
  }

  return (
    <div className="border-gray-200 border-t p-4">
      {primaryLabel ? (
        <div className="mb-4">
          <Button
            type="button"
            variant="harbr"
            className="flex w-full items-center justify-center"
            onClick={() => setAgreementOpen(true)}
          >
            {primaryLabel}
          </Button>
        </div>
      ) : null}

      {showViewLink ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setAgreementOpen(true)}
            className="cursor-pointer text-sm hover:underline"
            style={{ color: "hsl(252, 75%, 70%)" }}
          >
            View Agreement
          </button>
        </div>
      ) : null}

      {agreementOpen ? (
        <div className="mb-4 rounded-lg border border-border bg-neutral-50 p-3 text-sm">
          <p className="font-medium text-neutral-900">Harbour Demo — berth agreement</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {status === "approved"
              ? "Signed. This is a read-only preview for the prototype."
              : status === "to_be_approved"
                ? "Customer submitted. Review and approve to unlock the approved-reservation actions."
                : "Draft. In live Harbr you would edit terms here."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {status === "to_be_approved" ? (
              <Button type="button" variant="harbr" size="sm" onClick={onApprove}>
                Approve reservation
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setAgreementOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {showEditMove ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => inert("Edit dates and berth")}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white text-gray-700 hover:bg-gray-50"
              disabled={Boolean(moveReason)}
              title={moveReason ?? undefined}
              onClick={() => inert("Berth-to-berth move")}
            >
              Move
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="bg-white text-gray-700 hover:bg-gray-50"
          onClick={() => inert("Book another")}
        >
          Book another
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-red-200 bg-white text-red-600 hover:bg-red-50"
          disabled={Boolean(archiveReason)}
          title={archiveReason ?? undefined}
          onClick={onArchive}
        >
          Archive
        </Button>
      </div>
    </div>
  );
}

export function ReservationPanel() {
  const { state, setSelectedReservationId } = useMarina();
  const isOpen = Boolean(state.selectedReservationId);
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedReservationId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setSelectedReservationId]);

  if (!mounted && !isOpen) return null;

  const reservation = state.reservations.find((item) => item.id === state.selectedReservationId);
  const berth = reservation ? state.berths.find((item) => item.id === reservation.berthId) : undefined;
  const customer = reservation ? state.customers.find((item) => item.id === reservation.customerId) : undefined;
  const vessel = reservation ? state.vessels.find((item) => item.id === reservation.vesselId) : undefined;
  const status = reservation ? statusForReservation(reservation.status) : { label: "", color: "" };

  return (
    <>
      <div
        className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-200"
        aria-hidden="true"
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white text-sm shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "min(480px, 100vw)" }}
        data-testid="reservation-detail-sidebar"
        data-panel-kind={berth?.kind}
        role="dialog"
        aria-modal="false"
        aria-label="Reservation details"
      >
        {!reservation || !berth || !customer || !vessel ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-end border-gray-200 border-b px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedReservationId(null)}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center p-8 text-center text-gray-600">
              Reservation not found
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col bg-white text-sm">
            <div className="flex items-start justify-between gap-3 border-gray-200 border-b px-6 py-4">
              <h2 className="min-w-0 flex-1 font-semibold text-gray-900 text-xl">
                <span className="break-all">{vessel.name}</span>
                {"  "}
                <span data-testid="reservation-card-label" className="text-sm" style={{ color: status.color }}>
                  {status.label}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReservationId(null)}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 px-5 py-4">
                <InfoRow icon={<Calendar className="h-5 w-5" />}>
                  {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                  <span className="ml-2 text-gray-500 text-sm">{durationLabel(reservation.startDate, reservation.endDate)}</span>
                </InfoRow>
                <InfoRow icon={<User className="h-5 w-5" />}>
                  <button
                    type="button"
                    onClick={() => inert("Customer profile")}
                    className="inline cursor-pointer break-all text-left text-[hsl(252,75%,70%)] hover:underline"
                    title="Click to view customer profile"
                  >
                    {customer.name}
                  </button>
                </InfoRow>
                <InfoRow icon={<MapPin className="h-5 w-5" />}>
                  Harbour Demo • {kindLabel(berth.kind, state.settings) === "Berth" ? "Berth" : kindLabel(berth.kind, state.settings)}{" "}
                  {berth.name}
                  <span className="text-gray-500">
                    {" "}
                    • {berth.lengthM}m × {berth.beamM}m
                  </span>
                </InfoRow>
                <InfoRow icon={<Mail className="h-5 w-5" />}>{emailFor(customer.name)}</InfoRow>
                <InfoRow icon={<Phone className="h-5 w-5" />}>{phoneFor(customer.id)}</InfoRow>
                <InfoRow icon={<Ship className="h-5 w-5" />}>
                  {vessel.name}
                  <span className="ml-2 text-gray-500 text-sm">
                    {vessel.lengthM}m × {vessel.beamM}m
                  </span>
                </InfoRow>
                <InfoRow icon={<Key className="h-5 w-5" />}>No key assigned</InfoRow>
                <InfoRow icon={<RefreshCw className="h-5 w-5" />}>
                  {daysInclusive(reservation.startDate, reservation.endDate) > 27 ? "Monthly" : "Daily"}
                </InfoRow>
                <InfoRow icon={<Users className="h-5 w-5" />}>
                  <div className="font-medium">Additional contacts</div>
                  <div className="mt-1 text-gray-500 text-xs">None</div>
                </InfoRow>
              </div>

              <div className="space-y-3 border-gray-200 border-t px-4 py-4">
                <NotesBlock reservationId={reservation.id} />
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

            <FooterActions reservation={reservation} />
          </div>
        )}
      </div>
    </>
  );
}
