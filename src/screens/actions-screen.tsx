import { MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { actionCounts } from "../lib/actions";
import { RESERVATION_STATUS_COLOR } from "../lib/reservation-footer";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";

type ActionsTab = "pending-changes" | "pending-approvals" | "outstanding-invoices" | "draft-invoices";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

function daysInclusive(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function durationLabel(start: string, end: string): string {
  const days = daysInclusive(start, end);
  if (days <= 0) return "—";
  const months = Math.floor(days / 30);
  if (months >= 1) {
    const remaining = days % 30;
    if (remaining === 0) return months === 1 ? "1 month" : `${months} months`;
    return months === 1 ? `1 month ${remaining}d` : `${months} months ${remaining}d`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks >= 1) {
    const remaining = days % 7;
    if (remaining === 0) return weeks === 1 ? "1 week" : `${weeks} weeks`;
    return weeks === 1 ? `1 week ${remaining}d` : `${weeks} weeks ${remaining}d`;
  }
  return days === 1 ? "1 day" : `${days} days`;
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function TabTrigger({
  value,
  current,
  label,
  count,
  onSelect,
}: {
  value: ActionsTab;
  current: ActionsTab;
  label: string;
  count: number;
  onSelect: (value: ActionsTab) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(value)}
      className={cn(
        "inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-all sm:px-6",
        "text-gray-600 hover:text-gray-900",
        active && "border-[hsl(252,75%,70%)] border-b-2 text-[hsl(252,75%,70%)]"
      )}
    >
      {label}
      <Badge variant="outline" className="ml-1">
        {count}
      </Badge>
    </button>
  );
}

function EmptyRow({ colSpan, children }: { colSpan: number; children: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function ActionsScreen() {
  const { state, approveChangeRequest, rejectChangeRequest, setSelectedReservationId, archiveReservation } =
    useMarina();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ActionsTab | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  const counts = actionCounts(state);
  const pendingChanges = useMemo(
    () =>
      state.changeRequests
        .filter((item) => item.status === "pending")
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.changeRequests]
  );
  const pendingApprovals = useMemo(
    () => state.reservations.filter((item) => item.status === "to_be_approved"),
    [state.reservations]
  );
  const outstanding = useMemo(
    () => state.customers.filter((item) => item.accountOverdue),
    [state.customers]
  );
  const drafts = state.invoices;
  const activeTab: ActionsTab =
    tab ?? (pendingChanges.length > 0 ? "pending-changes" : "pending-approvals");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 sm:p-5 sm:px-8" data-actions-screen>
      <div className="w-full">
        <div
          role="tablist"
          className="flex h-auto w-full flex-wrap justify-center gap-1 border-gray-200 border-b bg-transparent"
        >
          <TabTrigger
            value="pending-changes"
            current={activeTab}
            label="Pending Changes"
            count={counts.pendingChanges}
            onSelect={setTab}
          />
          <TabTrigger
            value="pending-approvals"
            current={activeTab}
            label="Pending Approvals"
            count={counts.pendingApprovals}
            onSelect={setTab}
          />
          <TabTrigger
            value="outstanding-invoices"
            current={activeTab}
            label="Outstanding Invoices"
            count={counts.outstandingInvoices}
            onSelect={setTab}
          />
          <TabTrigger
            value="draft-invoices"
            current={activeTab}
            label="Draft Invoices"
            count={counts.draftInvoices}
            onSelect={setTab}
          />
        </div>

        {activeTab === "pending-changes" ? (
          <div className="mt-6 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <CardTitle className="font-semibold text-xl">Pending Changes</CardTitle>
                  <Badge className="ml-3" variant="outline">
                    {pendingChanges.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Customer</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Vessel</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Submitted</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Field</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Current</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Requested</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingChanges.length === 0 ? (
                        <EmptyRow colSpan={7}>No pending changes</EmptyRow>
                      ) : (
                        pendingChanges.map((request) => {
                          const customer = state.customers.find((item) => item.id === request.customerId);
                          const vessel = request.vesselId
                            ? state.vessels.find((item) => item.id === request.vesselId)
                            : undefined;
                          return request.fields.map((field, index) => (
                            <tr key={`${request.id}-${field.key}`} className="border-t" data-change-request={request.id}>
                              {index === 0 ? (
                                <td className="py-4 text-sm" rowSpan={request.fields.length}>
                                  <span className="font-medium text-[hsl(252,75%,70%)]">{customer?.name ?? "Customer"}</span>
                                </td>
                              ) : null}
                              {index === 0 ? (
                                <td className="py-4 text-sm" rowSpan={request.fields.length}>
                                  {vessel?.name ?? "Contact details"}
                                </td>
                              ) : null}
                              {index === 0 ? (
                                <td className="py-4 text-muted-foreground text-sm" rowSpan={request.fields.length}>
                                  {new Date(request.createdAt).toLocaleString()}
                                </td>
                              ) : null}
                              <td className="py-4 text-sm">{field.label}</td>
                              <td className="py-4 text-muted-foreground text-sm">{field.from}</td>
                              <td className="py-4 font-medium text-[hsl(252,75%,70%)] text-sm">{field.to}</td>
                              {index === 0 ? (
                                <td className="py-4" rowSpan={request.fields.length}>
                                  <div className="flex justify-start gap-2">
                                    <button
                                      type="button"
                                      className="flex h-8 items-center justify-center rounded-md bg-[hsl(252,75%,70%)] px-4 py-2 text-sm text-white transition-colors hover:bg-[hsl(252,75%,60%)]"
                                      onClick={() => {
                                        approveChangeRequest(request.id);
                                        toast.success("Changes approved");
                                      }}
                                    >
                                      Approve
                                    </button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 border-red-300 text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setRejectId(request.id);
                                        setRejectReason("");
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          ));
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "pending-approvals" ? (
          <div className="mt-6 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <CardTitle className="font-semibold text-xl">Pending Approvals</CardTitle>
                  <Badge className="ml-3" variant="outline">
                    {pendingApprovals.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Customer</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Vessel</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Arrival / Departure</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Berth</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Duration</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Status</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.length === 0 ? (
                        <EmptyRow colSpan={7}>No pending approvals</EmptyRow>
                      ) : (
                        pendingApprovals.map((reservation) => {
                          const customer = state.customers.find((item) => item.id === reservation.customerId);
                          const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
                          const berth = state.berths.find((item) => item.id === reservation.berthId);
                          return (
                            <tr key={reservation.id} className="border-t">
                              <td className="py-4 text-sm">
                                <span className="font-medium text-[hsl(252,75%,70%)]">{customer?.name}</span>
                              </td>
                              <td className="py-4 text-sm">{vessel?.name}</td>
                              <td className="py-4 text-sm">
                                <div className="mb-1 font-medium">{formatDate(reservation.startDate)}</div>
                                <div className="text-muted-foreground">{formatDate(reservation.endDate)}</div>
                              </td>
                              <td className="py-4 font-mono text-sm">{berth?.name}</td>
                              <td className="py-4 text-sm">{durationLabel(reservation.startDate, reservation.endDate)}</td>
                              <td className="py-4 text-sm">
                                <span style={{ color: RESERVATION_STATUS_COLOR.to_be_approved, fontWeight: 400 }}>
                                  To be approved
                                </span>
                              </td>
                              <td className="py-4">
                                <div className="relative flex justify-start gap-2">
                                  <button
                                    type="button"
                                    className="flex h-8 items-center justify-center rounded-md bg-[hsl(252,75%,70%)] px-4 py-2 text-sm text-white transition-colors hover:bg-[hsl(252,75%,60%)]"
                                    onClick={() => {
                                      setSelectedReservationId(reservation.id);
                                      navigate("/operations/calendar");
                                    }}
                                  >
                                    Review Agreement
                                  </button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    style={{
                                      borderColor: "hsl(252, 75%, 80%)",
                                      color: "hsl(252, 75%, 70%)",
                                      backgroundColor: "transparent",
                                    }}
                                    onClick={() => setMenuId(menuId === reservation.id ? null : reservation.id)}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                  {menuId === reservation.id ? (
                                    <div className="absolute top-9 right-0 z-10 min-w-32 rounded-md border bg-white py-1 shadow-md">
                                      <button
                                        type="button"
                                        className="w-full px-3 py-1.5 text-left text-red-600 text-sm hover:bg-red-50"
                                        onClick={() => {
                                          archiveReservation(reservation.id);
                                          setMenuId(null);
                                          toast.success("Reservation archived");
                                        }}
                                      >
                                        Archive
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "outstanding-invoices" ? (
          <div className="mt-6 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <CardTitle className="font-semibold text-xl">Outstanding Invoices</CardTitle>
                  <Badge className="ml-3" variant="outline">
                    {outstanding.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Contact</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Vessel</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Invoice</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.length === 0 ? (
                        <EmptyRow colSpan={4}>No outstanding invoices found</EmptyRow>
                      ) : (
                        outstanding.map((customer) => {
                          const vessel = state.vessels.find((item) => item.customerId === customer.id);
                          return (
                            <tr key={customer.id} className="border-t">
                              <td className="py-4 text-sm">
                                <div className="font-medium text-[hsl(252,75%,70%)]">{customer.name}</div>
                                <div className="text-muted-foreground text-sm">{customer.phone}</div>
                              </td>
                              <td className="py-4 text-sm">{vessel?.name ?? "—"}</td>
                              <td className="py-4 text-muted-foreground text-sm">Account overdue</td>
                              <td className="py-4 text-sm">
                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
                                  Overdue
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "draft-invoices" ? (
          <div className="mt-6 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <CardTitle className="font-semibold text-xl">Draft Invoices</CardTitle>
                  <Badge className="ml-3" variant="outline">
                    {drafts.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Contact</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Vessel</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Invoice</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Total Amount</th>
                        <th className="py-3 font-medium text-muted-foreground text-sm">Status</th>
                        <th className="py-3 text-center font-medium text-muted-foreground text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.length === 0 ? (
                        <EmptyRow colSpan={6}>No draft invoices</EmptyRow>
                      ) : (
                        drafts.map((invoice) => {
                          const customer = state.customers.find((item) => item.id === invoice.customerId);
                          const reservation = state.reservations.find((item) => item.id === invoice.reservationId);
                          const vessel = reservation
                            ? state.vessels.find((item) => item.id === reservation.vesselId)
                            : state.vessels.find((item) => item.customerId === invoice.customerId);
                          const total = invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
                          return (
                            <tr key={invoice.id} className="border-t">
                              <td className="py-4 text-sm">
                                <div className="font-medium text-[hsl(252,75%,70%)]">{customer?.name}</div>
                                <div className="text-muted-foreground text-sm">{customer?.phone}</div>
                              </td>
                              <td className="py-4 text-sm">{vessel?.name ?? "—"}</td>
                              <td className="py-4 font-mono text-sm">
                                <Link to={`/invoices/${invoice.id}`} className="text-[hsl(252,75%,70%)] hover:underline">
                                  {invoice.id}
                                </Link>
                              </td>
                              <td className="py-4 text-sm">{formatMoney(total)}</td>
                              <td className="py-4 text-sm">
                                <Badge
                                  variant="outline"
                                  className="border-gray-300 bg-gray-100 px-2 py-0.5 font-bold text-gray-800 text-xs"
                                >
                                  Draft
                                </Badge>
                              </td>
                              <td className="py-4 text-center">
                                <Link
                                  to={`/invoices/${invoice.id}`}
                                  className="inline-flex h-8 items-center rounded-md bg-[hsl(252,75%,70%)] px-4 text-sm text-white hover:bg-[hsl(252,75%,60%)]"
                                >
                                  Open
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {rejectId ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" data-reject-change-modal>
            <h2 className="text-sm font-semibold text-neutral-900">Reject changes</h2>
            <p className="mt-1 text-sm text-neutral-600">
              The owner will see this reason and can edit and resubmit.
            </p>
            <textarea
              className="mt-3 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              rows={4}
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                disabled={rejectReason.trim().length < 2}
                onClick={() => {
                  rejectChangeRequest(rejectId, rejectReason);
                  toast.success("Owner notified to resubmit");
                  setRejectId(null);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
