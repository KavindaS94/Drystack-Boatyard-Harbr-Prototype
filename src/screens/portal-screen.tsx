import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, LifeBuoy, Ship, User, Wrench } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { dnlStatus } from "../lib/dnl";
import { DEMO_FRIDAY } from "../lib/demo-dates";
import { jobProgressLabel } from "../lib/job-progress";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";
import type { ChangeRequest, VesselStorageStatus } from "../types/domain";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const STORAGE_LABEL: Record<VesselStorageStatus, string> = {
  stored: "Stored",
  launched: "In the water",
  departed: "Departed",
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function latestRequest(
  requests: ChangeRequest[],
  customerId: string,
  vesselId?: string
): ChangeRequest | undefined {
  const scope = vesselId ?? "";
  return requests
    .filter((item) => item.customerId === customerId && (item.vesselId ?? "") === scope)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function fieldValue(request: ChangeRequest | undefined, key: string): string | undefined {
  return request?.fields.find((field) => field.key === key)?.to;
}

function PortalCard({
  icon,
  title,
  children,
  highlight,
  cardId,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  highlight?: boolean;
  cardId?: string;
}) {
  return (
    <section
      id={cardId}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow",
        highlight && "border-[#9079ec] ring-2 ring-[#9079ec] ring-offset-2 ring-offset-gray-50"
      )}
      data-portal-highlight={highlight ? "true" : undefined}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9079ec]/15 text-[#9079ec]">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function PortalScreen() {
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const focusReservationId = searchParams.get("focus");
  const {
    state,
    requestLaunch,
    confirmDepartedByCustomer,
    signTc,
    submitChangeRequest,
  } = useMarina();

  const link = state.portalLinks.find((item) => item.token === token);
  const expired = link ? link.expiresAt < new Date().toISOString() : false;
  const customer = link ? state.customers.find((item) => item.id === link.customerId) : undefined;

  const vessels = useMemo(() => {
    if (!customer) return [];
    const owned = state.vessels.filter((vessel) => vessel.customerId === customer.id);
    if (!focusReservationId) return owned;
    const focused = state.reservations.find((item) => item.id === focusReservationId);
    if (!focused) return owned;
    return owned.slice().sort((a, b) => {
      if (a.id === focused.vesselId) return -1;
      if (b.id === focused.vesselId) return 1;
      return 0;
    });
  }, [customer, state.vessels, state.reservations, focusReservationId]);

  const yardJobs = useMemo(() => {
    if (!customer) return [];
    const jobs = state.reservations.filter(
      (reservation) =>
        reservation.customerId === customer.id &&
        reservation.job &&
        reservation.status !== "archived"
    );
    if (!focusReservationId) return jobs;
    return jobs.slice().sort((a, b) => {
      if (a.id === focusReservationId) return -1;
      if (b.id === focusReservationId) return 1;
      return 0;
    });
  }, [customer, state.reservations, focusReservationId]);

  const messages = useMemo(() => {
    if (!customer) return [];
    return state.messages
      .filter((message) => message.customerId === customer.id)
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [customer, state.messages]);

  const [requestVesselId, setRequestVesselId] = useState("");
  const [requestDate, setRequestDate] = useState(DEMO_FRIDAY);
  const [requestTime, setRequestTime] = useState("09:00");
  const [requestKind, setRequestKind] = useState<"launch" | "retrieval">("launch");
  const [signName, setSignName] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({ name: "", email: "", phone: "" });
  const [editingInsurance, setEditingInsurance] = useState<string | null>(null);
  const [insuranceDraft, setInsuranceDraft] = useState("");
  const [highlightFocus, setHighlightFocus] = useState(Boolean(focusReservationId));

  useEffect(() => {
    if (!focusReservationId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`portal-focus-${focusReservationId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightFocus(true);
    }, 80);
    const clear = window.setTimeout(() => setHighlightFocus(false), 4500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [focusReservationId, customer?.id]);

  if (!link || !customer || expired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4" data-portal-expired>
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#9079ec]">Harbr</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">This link has expired</h1>
          <p className="mt-2 text-sm text-gray-600">
            Links stay active for 7 days. Please ask the marina to send you a new one.
          </p>
        </div>
      </main>
    );
  }

  const owner = customer;
  const launchType = state.taskTypes.find((item) => item.kind === "launch" && item.active);
  const retrievalType = state.taskTypes.find((item) => item.kind === "retrieval" && item.active);
  const today = DEMO_FRIDAY;
  const contactRequest = latestRequest(state.changeRequests, owner.id);
  const contactPending = contactRequest?.status === "pending";
  const contactRejected = contactRequest?.status === "rejected";

  function vesselLiveStatus(vesselId: string): string {
    const vessel = state.vessels.find((item) => item.id === vesselId);
    if (!vessel) return "Unknown";
    const inProgress = state.launchTasks.find(
      (task) => task.vesselId === vesselId && task.status === "in_progress"
    );
    if (inProgress) {
      const kind = state.taskTypes.find((item) => item.id === inProgress.taskTypeId)?.kind;
      return kind === "retrieval" ? "Lifting now" : "Launching now";
    }
    return STORAGE_LABEL[vessel.storageStatus];
  }

  function nextTask(vesselId: string) {
    return state.launchTasks
      .filter(
        (task) =>
          task.vesselId === vesselId &&
          (task.status === "open" || task.status === "in_progress" || task.status === "requested") &&
          task.date >= today
      )
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
  }

  function onRequest() {
    if (!state.settings.allowPortalRequests) {
      toast.error("Customer requests are turned off for this marina");
      return;
    }
    const vessel = vessels.find((item) => item.id === (requestVesselId || vessels[0]?.id));
    if (!vessel) return;
    const dnl = dnlStatus(vessel, owner, state.settings);
    if (dnl.blocked) {
      toast.error(`Cannot request — ${dnl.reasons.join("; ")}`);
      return;
    }
    const taskType = requestKind === "launch" ? launchType : retrievalType;
    if (!taskType) return;
    const reservation = state.reservations.find(
      (item) => item.vesselId === vessel.id && item.status !== "archived"
    );
    const berthId = reservation?.berthId ?? state.berths.find((b) => b.kind === "dry_storage")?.id;
    if (!berthId) return;
    requestLaunch({
      taskTypeId: taskType.id,
      customerId: owner.id,
      vesselId: vessel.id,
      berthId,
      date: requestDate,
      time: requestTime,
    });
    toast.success("Request sent — waiting for marina approval");
  }

  function startContactEdit() {
    setContactDraft({
      name: fieldValue(contactRequest, "name") ?? owner.name,
      email: fieldValue(contactRequest, "email") ?? owner.email,
      phone: fieldValue(contactRequest, "phone") ?? owner.phone,
    });
    setEditingContact(true);
  }

  function saveContact() {
    const fields = [
      { key: "name", label: "Name", from: owner.name, to: contactDraft.name.trim() },
      { key: "email", label: "Email", from: owner.email, to: contactDraft.email.trim() },
      { key: "phone", label: "Phone", from: owner.phone, to: contactDraft.phone.trim() },
    ].filter((field) => field.from !== field.to && field.to.length > 0);
    if (fields.length === 0) {
      toast.message("Nothing changed");
      setEditingContact(false);
      return;
    }
    submitChangeRequest({ customerId: owner.id, fields });
    setEditingContact(false);
    toast.success("Sent to the marina for approval");
  }

  function saveInsurance(vesselId: string, from: string) {
    const to = insuranceDraft.trim();
    if (!to || to === from) {
      toast.message("Nothing changed");
      setEditingInsurance(null);
      return;
    }
    submitChangeRequest({
      customerId: owner.id,
      vesselId,
      fields: [{ key: "insuranceExpiry", label: "Insurance expiry", from, to }],
    });
    setEditingInsurance(null);
    toast.success("Sent to the marina for approval");
  }

  const focusedReservation = focusReservationId
    ? state.reservations.find((item) => item.id === focusReservationId)
    : undefined;
  const focusIsJob = Boolean(focusedReservation?.job);

  return (
    <main className="min-h-screen bg-gray-50 pb-12" data-customer-portal>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-sm font-medium text-[#9079ec]">Harbr</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">Your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Hi {customer.name.split(" ")[0]} — check status, request a launch, and sign yard terms.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
        <PortalCard icon={<User className="h-4 w-4" />} title="Contact details">
          {contactPending ? (
            <div className="space-y-3" data-contact-pending>
              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Pending marina approval
              </span>
              <p className="text-sm text-amber-800">Waiting for the marina to approve</p>
              <dl className="space-y-2 text-sm">
                {contactRequest.fields.map((field) => (
                  <div key={field.key} className="flex justify-between gap-4">
                    <dt className="text-gray-500">{field.label}</dt>
                    <dd className="font-medium text-amber-800">{field.to}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {contactRejected && !editingContact ? (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3" data-contact-rejected>
              <p className="text-sm font-medium text-red-800">The marina could not approve these changes</p>
              <p className="text-sm text-red-700">{contactRequest.rejectReason}</p>
              <Button type="button" size="sm" variant="harbr" onClick={startContactEdit}>
                Edit and resubmit
              </Button>
            </div>
          ) : null}

          {!contactPending && (editingContact || !contactRejected) ? (
            <div className="space-y-3">
              {editingContact ? (
                <>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-gray-500">Name</span>
                    <Input
                      value={contactDraft.name}
                      onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-gray-500">Email</span>
                    <Input
                      type="email"
                      value={contactDraft.email}
                      onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-gray-500">Phone</span>
                    <Input
                      value={contactDraft.phone}
                      onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))}
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingContact(false)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="harbr" className="flex-1" onClick={saveContact}>
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">{customer.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900">{customer.email}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{customer.phone}</dd>
                    </div>
                  </dl>
                  <Button type="button" size="sm" variant="harbrOutline" onClick={startContactEdit}>
                    Edit
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </PortalCard>

        {vessels.map((vessel) => {
          const dnl = dnlStatus(vessel, customer, state.settings);
          const upcoming = nextTask(vessel.id);
          const taskType = upcoming
            ? state.taskTypes.find((item) => item.id === upcoming.taskTypeId)
            : undefined;
          const reservation = state.reservations.find(
            (item) => item.vesselId === vessel.id && item.status !== "archived" && !item.job
          );
          const insuranceRequest = latestRequest(state.changeRequests, customer.id, vessel.id);
          const insurancePending = insuranceRequest?.status === "pending";
          const insuranceRejected = insuranceRequest?.status === "rejected";
          const highlight =
            highlightFocus &&
            !focusIsJob &&
            (reservation?.id === focusReservationId ||
              (focusedReservation?.vesselId === vessel.id && !focusedReservation.job));

          return (
            <PortalCard
              key={vessel.id}
              icon={<Ship className="h-4 w-4" />}
              title={vessels.length === 1 ? "Your boat" : vessel.name}
              highlight={highlight}
              cardId={reservation ? `portal-focus-${reservation.id}` : undefined}
            >
              <div className="space-y-3" data-portal-vessel={vessel.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{vessel.name}</p>
                    <p className="text-sm text-gray-500">
                      {vessel.lengthM}m × {vessel.beamM}m
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      vesselLiveStatus(vessel.id).endsWith(" now")
                        ? "bg-violet-100 text-violet-800"
                        : vessel.storageStatus === "launched"
                          ? "bg-teal-50 text-teal-800"
                          : "bg-neutral-100 text-neutral-800"
                    }`}
                    data-live-status
                  >
                    {vesselLiveStatus(vessel.id)}
                  </span>
                </div>

                {dnl.blocked ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-portal-dnl>
                    Your boat can&apos;t be launched right now — please contact the office:{" "}
                    {dnl.reasons.join("; ")}
                  </div>
                ) : null}

                {upcoming ? (
                  <p className="text-sm text-gray-700">
                    Next: {taskType?.name} {upcoming.date} {upcoming.time}
                    {upcoming.status === "requested"
                      ? " — awaiting confirmation"
                      : upcoming.status === "in_progress"
                        ? " — in progress"
                        : " — confirmed"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming launch or lift.</p>
                )}

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500">Insurance expiry</p>
                  {insurancePending ? (
                    <div data-insurance-pending>
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Pending marina approval
                      </span>
                      <p className="mt-2 text-sm text-amber-800">
                        Waiting for the marina to approve {fieldValue(insuranceRequest, "insuranceExpiry")}
                      </p>
                    </div>
                  ) : null}

                  {insuranceRejected && editingInsurance !== vessel.id ? (
                    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3" data-insurance-rejected>
                      <p className="text-sm font-medium text-red-800">The marina could not approve this date</p>
                      <p className="text-sm text-red-700">{insuranceRequest.rejectReason}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="harbr"
                        onClick={() => {
                          setInsuranceDraft(fieldValue(insuranceRequest, "insuranceExpiry") ?? vessel.insuranceExpiry);
                          setEditingInsurance(vessel.id);
                        }}
                      >
                        Edit and resubmit
                      </Button>
                    </div>
                  ) : null}

                  {!insurancePending && (editingInsurance === vessel.id || !insuranceRejected) ? (
                    editingInsurance === vessel.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={insuranceDraft}
                          onChange={(event) => setInsuranceDraft(event.target.value)}
                          className="h-9"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingInsurance(null)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" variant="harbr" onClick={() => saveInsurance(vessel.id, vessel.insuranceExpiry)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{vessel.insuranceExpiry}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="harbrOutline"
                          onClick={() => {
                            setInsuranceDraft(vessel.insuranceExpiry);
                            setEditingInsurance(vessel.id);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>

                {vessel.storageStatus === "launched" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      confirmDepartedByCustomer(vessel.id);
                      toast.success("Marked as departed");
                    }}
                  >
                    I&apos;ve departed
                  </Button>
                ) : null}
              </div>
            </PortalCard>
          );
        })}

        {state.settings.allowPortalRequests ? (
          <PortalCard icon={<LifeBuoy className="h-4 w-4" />} title="Request a launch or lift">
            <div className="space-y-3" data-portal-request>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-500">Boat</span>
                <select
                  value={requestVesselId || vessels[0]?.id || ""}
                  onChange={(event) => setRequestVesselId(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm"
                >
                  {vessels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              {(() => {
                const vessel = vessels.find((item) => item.id === (requestVesselId || vessels[0]?.id));
                const dnl = vessel ? dnlStatus(vessel, customer, state.settings) : { blocked: false, reasons: [] as string[] };
                if (dnl.blocked) {
                  return (
                    <div
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
                      data-portal-request-blocked
                    >
                      Your boat can&apos;t be launched right now — please contact the office:{" "}
                      {dnl.reasons.join("; ")}
                    </div>
                  );
                }
                return (
                  <>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={requestKind === "launch"}
                          onChange={() => setRequestKind("launch")}
                        />
                        Launch
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={requestKind === "retrieval"}
                          onChange={() => setRequestKind("retrieval")}
                        />
                        Lift
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
                      <Input type="time" value={requestTime} onChange={(e) => setRequestTime(e.target.value)} />
                    </div>
                    <Button type="button" variant="harbr" className="w-full" onClick={onRequest}>
                      Send request
                    </Button>
                  </>
                );
              })()}
            </div>
          </PortalCard>
        ) : null}

        {yardJobs.map((reservation) => {
          const job = reservation.job!;
          const jobType = state.jobTypes.find((item) => item.id === job.typeId);
          const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
          const progress = jobProgressLabel(job);
          const highlight = highlightFocus && focusIsJob && reservation.id === focusReservationId;

          return (
            <PortalCard
              key={reservation.id}
              icon={<Wrench className="h-4 w-4" />}
              title={`Yard job — ${vessel?.name ?? "Boat"}`}
              highlight={highlight}
              cardId={`portal-focus-${reservation.id}`}
            >
              <div data-portal-job={reservation.id}>
                <p className="text-sm text-gray-600">
                  {jobType?.name} · {reservation.startDate}–{reservation.endDate}
                  {job.liftTime ? ` · Lift ${job.liftTime}` : ""}
                  {job.workBy === "contractor" && job.contractorName
                    ? ` · ${job.contractorName}`
                    : job.workBy === "diy"
                      ? " · DIY"
                      : ""}
                </p>
                <p className="mt-2 text-sm font-medium text-gray-900">{progress}</p>

                {job.tcStatus === "sent" ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                    <p className="text-sm font-medium text-gray-900">Review and sign T&Cs</p>
                    <p className="text-xs text-gray-600">
                      Harbr yard terms: you accept liability for DIY work, confirm insurance is
                      current, and agree to the lift schedule.
                    </p>
                    <Input
                      placeholder="Type your full name to sign"
                      value={signName}
                      onChange={(event) => setSignName(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="harbr"
                      className="w-full"
                      disabled={signName.trim().length < 2}
                      onClick={() => {
                        signTc(reservation.id);
                        toast.success("T&Cs signed");
                        setSignName("");
                      }}
                    >
                      Sign T&Cs
                    </Button>
                  </div>
                ) : null}

                {job.tcStatus === "signed" ? (
                  <p className="mt-3 text-sm text-teal-700">T&Cs signed — thank you.</p>
                ) : null}
              </div>
            </PortalCard>
          );
        })}

        <PortalCard icon={<Bell className="h-4 w-4" />} title="Updates">
          <div data-portal-updates>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet.</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((message) => (
                  <li key={message.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-gray-500">
                      {message.channel.toUpperCase()} · {new Date(message.at).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium text-gray-900">{message.subject}</p>
                    <p className="text-sm text-gray-600">{message.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PortalCard>

        <p className="pt-2 text-center text-xs text-gray-500">
          This link expires on {formatExpiry(link.expiresAt)} ·{" "}
          <Link to="/operations/calendar" className="underline">
            Staff view
          </Link>
        </p>
      </div>
    </main>
  );
}
