import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { DnlBadge } from "../dnl-badge";
import { JobPanel } from "../reservation-panel/job-panel";
import { Badge } from "../ui/badge";
import { dnlStatus } from "../../lib/dnl";
import { formatDurationMinutes, minutesBetween } from "../../lib/equipment";
import { remapTravelLiftJobTypeId } from "../../lib/job-types";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { Job, Reservation, WorkBy } from "../../types/domain";

const WORK_BY_LABEL: Record<WorkBy, string> = {
  marina: "Marina",
  diy: "DIY",
  contractor: "Contractor",
};

const TC_TONE = {
  not_sent: "warning",
  sent: "warning",
  signed: "success",
} as const;

const TC_LABEL = {
  not_sent: "T&Cs not sent",
  sent: "T&Cs sent",
  signed: "T&Cs signed",
} as const;

function tint(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function jobProgress(job: Job): string | null {
  const total = job.checklist.length;
  if (total === 0) return null;
  const done = job.checklist.filter((item) => item.done).length;
  return `${done}/${total} checks`;
}

export function JobsWorkspace() {
  const { state, setSelectedReservationId } = useMarina();
  const [query, setQuery] = useState("");
  const [mobileDetail, setMobileDetail] = useState(false);

  const jobs = useMemo(() => {
    return state.reservations
      .filter((reservation) => {
        if (reservation.status === "archived" || !reservation.job) return false;
        const berth = state.berths.find((item) => item.id === reservation.berthId);
        return berth?.kind === "boatyard";
      })
      .slice()
      .sort((a, b) => {
        const berthA = state.berths.find((item) => item.id === a.berthId)?.name ?? "";
        const berthB = state.berths.find((item) => item.id === b.berthId)?.name ?? "";
        return berthA.localeCompare(berthB, undefined, { numeric: true });
      });
  }, [state.berths, state.reservations]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((reservation) => {
      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
      const customer = state.customers.find((item) => item.id === reservation.customerId);
      const berth = state.berths.find((item) => item.id === reservation.berthId);
      const jobType = state.jobTypes.find(
        (item) => item.id === remapTravelLiftJobTypeId(reservation.job?.typeId ?? "")
      );
      return [vessel?.name, customer?.name, berth?.name, jobType?.name].some((value) =>
        value?.toLowerCase().includes(q)
      );
    });
  }, [jobs, query, state.berths, state.customers, state.jobTypes, state.vessels]);

  useEffect(() => {
    if (jobs.length === 0) return;
    if (jobs.some((item) => item.id === state.selectedReservationId)) return;
    setSelectedReservationId(jobs[0].id);
  }, [jobs, setSelectedReservationId, state.selectedReservationId]);

  const selected = jobs.find((item) => item.id === state.selectedReservationId) ?? null;
  const selectedBerth = selected ? state.berths.find((item) => item.id === selected.berthId) : undefined;
  const selectedCustomer = selected ? state.customers.find((item) => item.id === selected.customerId) : undefined;
  const selectedVessel = selected ? state.vessels.find((item) => item.id === selected.vesselId) : undefined;
  const selectedJob = selected?.job;
  const selectedType = selectedJob
    ? state.jobTypes.find((item) => item.id === remapTravelLiftJobTypeId(selectedJob.typeId))
    : undefined;
  const dnl =
    selectedVessel && selectedCustomer
      ? dnlStatus(selectedVessel, selectedCustomer, state.settings)
      : { blocked: false, reasons: [] as string[] };
  const repairLabel =
    selectedJob?.liftTime && selectedJob.launchTime
      ? formatDurationMinutes(minutesBetween(selectedJob.liftTime, selectedJob.launchTime))
      : "";

  function selectJob(id: string) {
    setSelectedReservationId(id);
    setMobileDetail(true);
  }

  if (jobs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
          No open repair jobs on the yard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden" data-job-workspace>
      <aside
        className={cn(
          "flex w-full min-h-0 shrink-0 flex-col border-neutral-200 bg-neutral-50 sm:w-72 sm:border-r lg:w-[22rem]",
          mobileDetail ? "hidden sm:flex" : "flex"
        )}
      >
        <div className="shrink-0 space-y-2 border-b border-neutral-200 bg-white px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Jobs</h2>
            <p className="text-xs text-neutral-500">
              {matches.length} of {jobs.length}
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search boat, owner, yard"
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2" data-jobs-list>
          {matches.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-neutral-500">No matching jobs.</li>
          ) : (
            matches.map((reservation) => (
              <JobRow
                key={reservation.id}
                reservation={reservation}
                selected={reservation.id === selected?.id}
                onSelect={selectJob}
              />
            ))
          )}
        </ul>
      </aside>

      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col bg-white",
          mobileDetail ? "flex" : "hidden sm:flex"
        )}
        data-job-detail
      >
        {selected && selectedJob && selectedVessel && selectedCustomer && selectedBerth ? (
          <>
            <header className="shrink-0 border-b border-neutral-200 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setMobileDetail(false)}
                className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 sm:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
                Jobs
              </button>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-neutral-900">{selectedVessel.name}</h2>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {selectedBerth.name} · {selectedCustomer.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={selectedJob.status === "done" ? "success" : "neutral"}>
                    {selectedJob.status === "done" ? "Done" : "Open"}
                  </Badge>
                  {selectedType ? (
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{
                        backgroundColor: tint(selectedType.colour, 0.14),
                        color: selectedType.colour,
                      }}
                    >
                      {selectedType.name}
                    </Badge>
                  ) : null}
                  <Badge tone="neutral">
                    {selectedJob.workBy === "contractor" && selectedJob.contractorName
                      ? selectedJob.contractorName
                      : WORK_BY_LABEL[selectedJob.workBy]}
                  </Badge>
                  <Badge tone={TC_TONE[selectedJob.tcStatus]}>{TC_LABEL[selectedJob.tcStatus]}</Badge>
                  {dnl.blocked ? <DnlBadge status={dnl} /> : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" data-job-timeline>
                <TimelineStep
                  label="Lift"
                  value={selectedJob.liftTime ?? "Not scheduled"}
                  hint="Travel lift out"
                />
                <TimelineStep
                  label="Repair"
                  value={repairLabel || "Set lift and launch"}
                  hint="Time on the yard"
                  accent
                />
                <TimelineStep
                  label="Launch"
                  value={selectedJob.launchTime ?? "Not scheduled"}
                  hint={selectedJob.launchDate ?? "Back to water"}
                />
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <JobPanel reservationId={selected.id} plain heading={false} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
            Select a job from the list.
          </div>
        )}
      </section>
    </div>
  );
}

function TimelineStep({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        accent
          ? "border-[hsl(252,75%,88%)] bg-[hsl(252,75%,97%)]"
          : "border-neutral-200 bg-neutral-50"
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          accent ? "text-[hsl(252,75%,40%)]" : "text-neutral-500"
        )}
      >
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{hint}</p>
    </div>
  );
}

function JobRow({
  reservation,
  selected,
  onSelect,
}: {
  reservation: Reservation;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { state } = useMarina();
  const job = reservation.job;
  const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
  const customer = state.customers.find((item) => item.id === reservation.customerId);
  const berth = state.berths.find((item) => item.id === reservation.berthId);
  const jobType = job
    ? state.jobTypes.find((item) => item.id === remapTravelLiftJobTypeId(job.typeId))
    : undefined;
  if (!job || !vessel || !customer || !berth) return null;
  const progress = jobProgress(job);
  const colour = jobType?.colour ?? "#a3a3a3";
  const workLabel =
    job.workBy === "contractor" && job.contractorName
      ? job.contractorName
      : WORK_BY_LABEL[job.workBy];

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(reservation.id)}
        data-job-row={reservation.id}
        className={cn(
          "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
          selected
            ? "border-neutral-300 bg-white shadow-sm"
            : "border-transparent hover:border-neutral-200 hover:bg-white"
        )}
        style={{
          boxShadow: selected ? `inset 3px 0 0 ${colour}` : undefined,
          backgroundColor: selected ? tint(colour, 0.08) : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{vessel.name}</p>
            <p className="truncate text-xs text-neutral-500">{customer.name}</p>
          </div>
          <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-medium text-neutral-700">
            {berth.name}
          </span>
        </div>
        <p className="mt-1.5 truncate text-xs text-neutral-600">
          {jobType?.name ?? "Job"}
          {workLabel && workLabel !== jobType?.name ? ` · ${workLabel}` : ""}
          {progress ? ` · ${progress}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {job.liftTime ? `Lift ${job.liftTime}` : "Lift not set"}
          {" · "}
          {job.launchTime ? `Launch ${job.launchTime}` : "Launch not set"}
        </p>
      </button>
    </li>
  );
}
