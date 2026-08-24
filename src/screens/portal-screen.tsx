import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { dnlStatus } from "../lib/dnl";
import { DEMO_FRIDAY } from "../lib/demo-dates";
import { jobProgressLabel } from "../lib/job-progress";
import { useMarina } from "../store/marina-store";
import type { VesselStorageStatus } from "../types/domain";
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

export function PortalScreen() {
  const { token = "" } = useParams();
  const {
    state,
    requestLaunch,
    confirmDepartedByCustomer,
    signTc,
    updateInsuranceExpiry,
  } = useMarina();

  const link = state.portalLinks.find((item) => item.token === token);
  const expired = link ? link.expiresAt < new Date().toISOString() : false;
  const customer = link ? state.customers.find((item) => item.id === link.customerId) : undefined;

  const vessels = useMemo(() => {
    if (!customer) return [];
    return state.vessels.filter((vessel) => vessel.customerId === customer.id);
  }, [customer, state.vessels]);

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
  const [insuranceEdits, setInsuranceEdits] = useState<Record<string, string>>({});

  if (!link || !customer || expired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4" data-portal-expired>
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[hsl(252,75%,45%)]">Harbour Demo</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">This link has expired</h1>
          <p className="mt-2 text-sm text-gray-600">
            Links stay active for 7 days. Please ask the marina to send you a new one.
          </p>
        </div>
      </main>
    );
  }

  const launchType = state.taskTypes.find((item) => item.kind === "launch" && item.active);
  const retrievalType = state.taskTypes.find((item) => item.kind === "retrieval" && item.active);
  const today = DEMO_FRIDAY;

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
    if (!vessel || !customer) return;
    const dnl = dnlStatus(vessel, customer, state.settings);
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
      customerId: customer.id,
      vesselId: vessel.id,
      berthId,
      date: requestDate,
      time: requestTime,
    });
    toast.success("Request sent — waiting for marina approval");
  }

  const yardJobs = state.reservations.filter(
    (reservation) =>
      reservation.customerId === customer.id &&
      reservation.job &&
      reservation.status !== "archived"
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-12" data-customer-portal>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="font-medium text-[hsl(252,75%,45%)] text-sm">Harbour Demo</p>
          <h1 className="mt-1 font-bold text-2xl text-gray-900 sm:text-3xl">Your boats</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Hi {customer.name.split(" ")[0]} — check status, request a launch, and sign yard terms.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
        {vessels.map((vessel) => {
          const dnl = dnlStatus(vessel, customer, state.settings);
          const upcoming = nextTask(vessel.id);
          const taskType = upcoming
            ? state.taskTypes.find((item) => item.id === upcoming.taskTypeId)
            : undefined;
          const insuranceValue = insuranceEdits[vessel.id] ?? vessel.insuranceExpiry;

          return (
            <section
              key={vessel.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              data-portal-vessel={vessel.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{vessel.name}</h2>
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
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-portal-dnl>
                  Your boat can&apos;t be launched right now — please contact the office:{" "}
                  {dnl.reasons.join("; ")}
                </div>
              ) : null}

              {upcoming ? (
                <p className="mt-3 text-sm text-gray-700">
                  Next: {taskType?.name} {upcoming.date} {upcoming.time}
                  {upcoming.status === "requested"
                    ? " — awaiting confirmation"
                    : upcoming.status === "in_progress"
                      ? " — in progress"
                      : " — confirmed"}
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No upcoming launch or lift.</p>
              )}

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500">Insurance expiry</p>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={insuranceValue}
                    onChange={(event) =>
                      setInsuranceEdits((current) => ({ ...current, [vessel.id]: event.target.value }))
                    }
                    className="h-9"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateInsuranceExpiry(vessel.id, insuranceValue);
                      toast.success("Insurance updated");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {vessel.storageStatus === "launched" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => {
                    confirmDepartedByCustomer(vessel.id);
                    toast.success("Marked as departed");
                  }}
                >
                  I&apos;ve departed
                </Button>
              ) : null}
            </section>
          );
        })}

        {state.settings.allowPortalRequests ? (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" data-portal-request>
            <h2 className="text-base font-semibold text-gray-900">Request a launch or lift</h2>
            <div className="mt-3 space-y-3">
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
          </section>
        ) : null}

        {yardJobs.map((reservation) => {
          const job = reservation.job!;
          const jobType = state.jobTypes.find((item) => item.id === job.typeId);
          const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
          const progress = jobProgressLabel(job);

          return (
            <section
              key={reservation.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              data-portal-job={reservation.id}
            >
              <h2 className="text-base font-semibold text-gray-900">
                Yard job — {vessel?.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
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
                    Harbour Demo yard terms: you accept liability for DIY work, confirm insurance is
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
            </section>
          );
        })}

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" data-portal-updates>
          <h2 className="text-base font-semibold text-gray-900">Updates</h2>
          {messages.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
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
        </section>

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
