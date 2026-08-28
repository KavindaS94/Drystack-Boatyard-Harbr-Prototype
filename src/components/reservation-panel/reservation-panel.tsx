import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Key,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Ship,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { DnlBadge } from "../dnl-badge";
import { dnlStatus } from "../../lib/dnl";
import { kindLabel } from "../../lib/labels";
import { conflictDetailsForBerth } from "../../lib/availability";
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
import type { MessageTemplate, Reservation, ReservationStatus } from "../../types/domain";
import { DryStoragePanel } from "./dry-storage-panel";
import { JobPanel } from "./job-panel";
import { PlaceBookingModal } from "./place-booking-modal";
import { WetPanel } from "./wet-panel";
import { ConflictModal } from "./conflict-modal";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const MESSAGE_TEMPLATES: { id: MessageTemplate; subject: string; body: string }[] = [
  {
    id: "insurance_reminder",
    subject: "7-day insurance reminder",
    body: "Friendly reminder — your vessel insurance is due to expire within 7 days. Please update it so we can keep launching.",
  },
  {
    id: "dnl_notice",
    subject: "Do not launch notice",
    body: "Your boat cannot be launched right now. Please contact the marina office.",
  },
  {
    id: "payment_reminder",
    subject: "Payment reminder",
    body: "Friendly reminder — your account has an outstanding balance. Please settle it so we can continue launch services.",
  },
  {
    id: "boat_ready",
    subject: "Boat ready",
    body: "Your boat is ready. Please come to the marina when convenient.",
  },
  {
    id: "launch_confirmed",
    subject: "Launch confirmed",
    body: "Your launch request has been confirmed. See you at the marina.",
  },
];

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

function NotesBlock({ reservationId, notes }: { reservationId: string; notes?: string }) {
  const { updateNotes } = useMarina();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(notes ?? "");
    setSaved(false);
    setOpen(false);
  }, [reservationId, notes]);

  const preview = value.trim() || "No notes yet — expand to add notes";

  function save() {
    updateNotes(reservationId, value);
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

function CollapsibleBlock({
  title,
  preview,
  children,
  defaultOpen = false,
}: {
  title: string;
  preview?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/80">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-100/80"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground text-sm">{title}</div>
          {!open && preview ? (
            <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">{preview}</p>
          ) : null}
        </div>
      </button>
      {open ? <div className="border-t border-gray-200 bg-white px-3 py-3">{children}</div> : null}
    </div>
  );
}

function SendMessageDialog({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const { sendMessage } = useMarina();
  const [channel, setChannel] = useState<"email" | "sms">("sms");
  const [templateId, setTemplateId] = useState<MessageTemplate>("dnl_notice");

  function onSend() {
    const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    sendMessage({
      customerId,
      channel,
      template: template.id,
      subject: template.subject,
      body: template.body,
    });
    toast.success(`Sent via ${channel.toUpperCase()} (simulated)`);
    onClose();
  }

  const preview = MESSAGE_TEMPLATES.find((item) => item.id === templateId);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" data-send-message-dialog>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">Send message</h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500">
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Template</span>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value as MessageTemplate)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {MESSAGE_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.subject}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={channel === "sms"} onChange={() => setChannel("sms")} />
              SMS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={channel === "email"} onChange={() => setChannel("email")} />
              Email
            </label>
          </div>
          {preview ? (
            <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">{preview.body}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="harbr" className="flex-1" onClick={onSend}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SendPortalLinkDialog({
  customerId,
  reservationId,
  onClose,
}: {
  customerId: string;
  reservationId: string;
  onClose: () => void;
}) {
  const { createPortalLink } = useMarina();
  const [channel, setChannel] = useState<"email" | "sms">("sms");
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null);

  function onSend() {
    const link = createPortalLink(customerId);
    const url = `${link.url}?focus=${encodeURIComponent(reservationId)}`;
    setResult({ url, expiresAt: link.expiresAt });
    toast.success(`Status link sent via ${channel.toUpperCase()}`);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" data-send-portal-dialog>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">Send status link</h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-500">
            Close
          </button>
        </div>
        {!result ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-neutral-600">
              Customer can view boat status, request a launch, and sign yard T&Cs — no login.
            </p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={channel === "sms"} onChange={() => setChannel("sms")} />
                SMS
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={channel === "email"} onChange={() => setChannel("email")} />
                Email
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="harbr" className="flex-1" onClick={onSend}>
                Send link
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-neutral-500">
              Expires {new Date(result.expiresAt).toLocaleDateString()}
            </p>
            <code className="block break-all rounded-md bg-neutral-50 p-2 text-xs">{result.url}</code>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(result.url);
                  toast.success("Link copied");
                }}
              >
                Copy link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="harbr"
                onClick={() => window.open(result.url, "_blank")}
              >
                Open as customer
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function EditReservationModal({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const { state, updateReservation } = useMarina();
  const berth = state.berths.find((item) => item.id === reservation.berthId);
  const sameKind = state.berths.filter((item) => item.kind === berth?.kind);
  const [startDate, setStartDate] = useState(reservation.startDate);
  const [endDate, setEndDate] = useState(reservation.endDate);
  const [berthId, setBerthId] = useState(reservation.berthId);
  const [conflict, setConflict] = useState<ReturnType<typeof conflictDetailsForBerth>>(null);

  function occupancyLabel(id: string): string {
    const taken = conflictDetailsForBerth(state.reservations, state.berths, id, startDate, endDate, reservation.id);
    return taken ? " — unavailable" : "";
  }

  function onSave() {
    if (startDate > endDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    const nextConflict = conflictDetailsForBerth(
      state.reservations,
      state.berths,
      berthId,
      startDate,
      endDate,
      reservation.id
    );
    if (nextConflict) {
      setConflict(nextConflict);
      return;
    }
    updateReservation(reservation.id, { startDate, endDate, berthId });
    toast.success("Reservation updated");
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" data-edit-reservation-modal>
        <h2 className="text-sm font-semibold text-neutral-900">Edit reservation</h2>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">End</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Berth</span>
            <select
              value={berthId}
              onChange={(event) => setBerthId(event.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {sameKind.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {occupancyLabel(item.id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="harbr" className="flex-1" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
      {conflict ? (
        <ConflictModal
          conflict={conflict}
          onClose={() => setConflict(null)}
          onViewCalendar={() => {
            setConflict(null);
            onClose();
          }}
        />
      ) : null}
    </div>,
    document.body
  );
}

function MoveReservationModal({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const { state, updateReservation } = useMarina();
  const [startDate, setStartDate] = useState(reservation.startDate);
  const [endDate, setEndDate] = useState(reservation.endDate);
  const [berthId, setBerthId] = useState(reservation.berthId);
  const [conflict, setConflict] = useState<ReturnType<typeof conflictDetailsForBerth>>(null);

  function occupancyLabel(id: string): string {
    const taken = conflictDetailsForBerth(state.reservations, state.berths, id, startDate, endDate, reservation.id);
    return taken ? " — unavailable" : "";
  }

  function onSave() {
    if (startDate > endDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    const nextConflict = conflictDetailsForBerth(
      state.reservations,
      state.berths,
      berthId,
      startDate,
      endDate,
      reservation.id
    );
    if (nextConflict) {
      setConflict(nextConflict);
      return;
    }
    updateReservation(reservation.id, { startDate, endDate, berthId });
    toast.success("Reservation moved");
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" data-move-reservation-modal>
        <h2 className="text-sm font-semibold text-neutral-900">Move reservation</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Includes berths, {state.settings.boatyardLabel.toLowerCase()} pads, and {state.settings.dryStorageLabel.toLowerCase()}{" "}
          racks. Occupied spaces show as unavailable.
        </p>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-500">End</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Move to</span>
            <select
              value={berthId}
              onChange={(event) => setBerthId(event.target.value)}
              data-move-berth-select
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {state.berths.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {kindLabel(item.kind, state.settings)}
                  {occupancyLabel(item.id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="harbr" className="flex-1" onClick={onSave}>
            Move
          </Button>
        </div>
      </div>
      {conflict ? (
        <ConflictModal
          conflict={conflict}
          onClose={() => setConflict(null)}
          onViewCalendar={() => {
            setConflict(null);
            onClose();
          }}
        />
      ) : null}
    </div>,
    document.body
  );
}

function FooterActions({
  reservation,
  onEdit,
  onMove,
  onSendPortal,
  onBookAnother,
}: {
  reservation: Reservation;
  onEdit: () => void;
  onMove: () => void;
  onSendPortal: () => void;
  onBookAnother: () => void;
}) {
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
      <div className="mb-4">
        <Button
          type="button"
          variant="harbrOutline"
          className="flex w-full items-center justify-center"
          onClick={onSendPortal}
        >
          <Link2 className="h-4 w-4" />
          Send status link
        </Button>
      </div>

      {primaryLabel ? (
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
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
          <p className="font-medium text-neutral-900">Harbr — berth agreement</p>
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
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white text-gray-700 hover:bg-gray-50"
              disabled={Boolean(moveReason)}
              title={moveReason ?? undefined}
              data-open-move
              onClick={onMove}
            >
              Move
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="bg-white text-gray-700 hover:bg-gray-50"
          data-book-another
          onClick={onBookAnother}
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
  const { state, setSelectedReservationId, setDnlOverride } = useMarina();
  const isOpen = Boolean(state.selectedReservationId);
  const [mounted, setMounted] = useState(isOpen);
  const [portalOpen, setPortalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [bookAnotherOpen, setBookAnotherOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

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

  const reservation = state.reservations.find((item) => item.id === state.selectedReservationId);
  const berth = reservation ? state.berths.find((item) => item.id === reservation.berthId) : undefined;
  const customer = reservation ? state.customers.find((item) => item.id === reservation.customerId) : undefined;
  const vessel = reservation ? state.vessels.find((item) => item.id === reservation.vesselId) : undefined;
  const status = reservation ? statusForReservation(reservation.status) : { label: "", color: "" };

  const dnl =
    vessel && customer
      ? dnlStatus(vessel, customer, state.settings)
      : { blocked: false, reasons: [] as string[] };

  const activity = useMemo(() => {
    if (!reservation) return [];
    return state.activity
      .filter(
        (event) =>
          event.reservationId === reservation.id ||
          event.vesselId === reservation.vesselId ||
          event.customerId === reservation.customerId
      )
      .slice(0, 20);
  }, [reservation, state.activity]);

  const messages = useMemo(() => {
    if (!reservation) return [];
    return state.messages
      .filter((message) => message.customerId === reservation.customerId)
      .slice(0, 15);
  }, [reservation, state.messages]);

  if (!mounted && !isOpen) return null;

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
                {dnl.blocked || berth.kind === "dry_storage" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <DnlBadge status={dnl} />
                    {dnl.blocked ? (
                      <span className="text-xs text-red-700">{dnl.reasons.join("; ")}</span>
                    ) : (
                      <span className="text-xs text-teal-700">Clear to launch</span>
                    )}
                  </div>
                ) : null}

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
                  {customer.accountOverdue ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                      Overdue
                    </span>
                  ) : null}
                </InfoRow>
                <InfoRow icon={<MapPin className="h-5 w-5" />}>
                  Harbr • {kindLabel(berth.kind, state.settings) === "Berth" ? "Berth" : kindLabel(berth.kind, state.settings)}{" "}
                  {berth.name}
                  <span className="text-gray-500">
                    {" "}
                    • {berth.lengthM}m × {berth.beamM}m
                  </span>
                </InfoRow>
                <InfoRow icon={<Mail className="h-5 w-5" />}>{customer.email}</InfoRow>
                <InfoRow icon={<Phone className="h-5 w-5" />}>{customer.phone}</InfoRow>
                <InfoRow icon={<Ship className="h-5 w-5" />}>
                  {vessel.name}
                  <span className="ml-2 text-gray-500 text-sm">
                    {vessel.lengthM}m × {vessel.beamM}m · Ins. {formatDate(vessel.insuranceExpiry)}
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
                {state.role === "office" && berth.kind === "dry_storage" ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-3" data-dnl-override>
                    <p className="text-xs font-medium text-neutral-500">Do-not-launch override</p>
                    {vessel.dnlOverride?.active ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-red-800">{vessel.dnlOverride.reason}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDnlOverride(vessel.id, false, "");
                            toast.success("Manual DNL cleared");
                          }}
                        >
                          Clear override
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          const reason = window.prompt("Override reason (logged for audit)", "Safety hold");
                          if (!reason) return;
                          setDnlOverride(vessel.id, true, reason);
                          toast.success("Manual DNL set");
                        }}
                      >
                        Set manual DNL
                      </Button>
                    )}
                  </div>
                ) : null}

                <NotesBlock reservationId={reservation.id} notes={reservation.notes} />

                {state.changeRequests.some(
                  (item) => item.customerId === customer.id && item.status === "pending"
                ) ? (
                  <div
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    data-pending-changes-notice
                  >
                    Pending changes (
                    {state.changeRequests.filter((item) => item.customerId === customer.id && item.status === "pending").length}
                    ) —{" "}
                    <Link to="/dashboard/actions" className="font-medium underline">
                      Review in Actions
                    </Link>
                  </div>
                ) : null}

                <CollapsibleBlock
                  title="Messages"
                  preview={messages[0] ? `${messages[0].subject} · ${messages.length} total` : "No messages yet"}
                >
                  <div className="space-y-3">
                    <Button type="button" size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
                      <MessageSquare className="mr-1 h-3.5 w-3.5" />
                      Send message
                    </Button>
                    {messages.length === 0 ? (
                      <p className="text-xs text-neutral-500">Nothing sent yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {messages.map((message) => (
                          <li key={message.id} className="text-xs text-neutral-700">
                            <span className="font-medium uppercase text-neutral-500">{message.channel}</span>
                            {" · "}
                            {message.subject}
                            <div className="text-neutral-500">{new Date(message.at).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CollapsibleBlock>

                <CollapsibleBlock
                  title="Activity"
                  preview={activity[0]?.message ?? "No activity yet"}
                >
                  {activity.length === 0 ? (
                    <p className="text-xs text-neutral-500">No activity yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activity.map((event) => (
                        <li key={event.id} className="text-xs text-neutral-700">
                          <span className="font-medium capitalize text-neutral-500">{event.actor}</span>
                          {" · "}
                          {event.message}
                          <div className="text-neutral-400">{new Date(event.at).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CollapsibleBlock>

                {(berth.kind === "boatyard" && state.settings.boatyardEnabled) || berth.kind === "wet" ? (
                  <JobPanel reservationId={reservation.id} />
                ) : null}
                {berth.kind === "wet" ? (
                  <WetPanel
                    reservationId={reservation.id}
                    boatyardLabel={state.settings.boatyardLabel}
                    dryStorageLabel={state.settings.dryStorageLabel}
                    hasJob={Boolean(reservation.job)}
                  />
                ) : null}
                {berth.kind === "dry_storage" ? (
                  <DryStoragePanel
                    reservationId={reservation.id}
                    vesselId={vessel.id}
                    storageStatus={vessel.storageStatus}
                  />
                ) : null}
              </div>
            </div>

            <FooterActions
              reservation={reservation}
              onEdit={() => setEditOpen(true)}
              onMove={() => setMoveOpen(true)}
              onSendPortal={() => setPortalOpen(true)}
              onBookAnother={() => setBookAnotherOpen(true)}
            />
          </div>
        )}
      </div>

      {portalOpen && customer && reservation ? (
        <SendPortalLinkDialog
          customerId={customer.id}
          reservationId={reservation.id}
          onClose={() => setPortalOpen(false)}
        />
      ) : null}
      {messageOpen && customer ? (
        <SendMessageDialog customerId={customer.id} onClose={() => setMessageOpen(false)} />
      ) : null}
      {editOpen && reservation ? (
        <EditReservationModal reservation={reservation} onClose={() => setEditOpen(false)} />
      ) : null}
      {moveOpen && reservation ? (
        <MoveReservationModal reservation={reservation} onClose={() => setMoveOpen(false)} />
      ) : null}
      {bookAnotherOpen && reservation ? (
        <PlaceBookingModal
          title="Book another"
          sourceReservationId={reservation.id}
          onClose={() => setBookAnotherOpen(false)}
        />
      ) : null}
    </>
  );
}
