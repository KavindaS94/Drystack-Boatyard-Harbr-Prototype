import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { draftFromJob, invoiceBannerText } from "../../lib/invoice";
import { useMarina } from "../../store/marina-store";
import type { Job, JobType, TcStatus, WorkBy } from "../../types/domain";
import { Button } from "../ui/button";
import { JobLines } from "./job-lines";

interface JobPanelProps {
  reservationId: string;
}

const TC_LABEL: Record<TcStatus, string> = {
  not_sent: "Not sent",
  sent: "Sent",
  signed: "Signed",
};

const WORK_BY_LABEL: Record<WorkBy, string> = {
  marina: "Marina",
  diy: "DIY",
  contractor: "Contractor",
};

function checklistFromType(jobType: JobType): Job["checklist"] {
  return jobType.checklist.map((label) => ({ label, done: false }));
}

function defaultPhotos(): Job["photos"] {
  return [
    { stage: "lift_out", done: false },
    { stage: "relaunch", done: false },
  ];
}

function jobFromType(jobType: JobType, previous?: Job): Job {
  return {
    typeId: jobType.id,
    location: previous?.location ?? "dockyard",
    workBy: previous?.workBy ?? "marina",
    contractorName: previous?.contractorName,
    liftTime: previous?.liftTime,
    launchTime: previous?.launchTime,
    launchDate: previous?.launchDate,
    tcStatus: previous?.tcStatus ?? "not_sent",
    tcSignedAt: previous?.tcSignedAt,
    checklist: checklistFromType(jobType),
    photos: previous?.photos ?? defaultPhotos(),
    hours: previous?.hours ?? [],
    materials: previous?.materials ?? [],
    status: previous?.status ?? "open",
  };
}

export function JobPanel({ reservationId }: JobPanelProps) {
  const navigate = useNavigate();
  const {
    state,
    updateJob,
    addJobLine,
    createDraftFromJob,
    sendTc,
    assignContractor,
    notifyContractor,
    rescheduleRelaunch,
    toggleJobPhoto,
  } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const berth = state.berths.find((item) => item.id === reservation?.berthId);
  const job = reservation?.job;
  const jobType = state.jobTypes.find((item) => item.id === job?.typeId);
  const activeTypes = state.jobTypes.filter((item) => item.active);
  const isBerth = berth?.kind === "wet";
  const hidePrices = state.role === "yard" && state.settings.hidePricesForYard;
  const canCreateDraft = state.role === "office";

  const [open, setOpen] = useState(true);
  const [relaunchDate, setRelaunchDate] = useState(job?.launchDate ?? reservation?.endDate ?? "");
  const [relaunchTime, setRelaunchTime] = useState(job?.launchTime ?? "");

  useEffect(() => {
    setOpen(true);
    setRelaunchDate(job?.launchDate ?? reservation?.endDate ?? "");
    setRelaunchTime(job?.launchTime ?? "");
  }, [reservationId, job?.launchDate, job?.launchTime, reservation?.endDate]);

  if (!reservation || !job || !jobType) return null;
  const currentJob = job;

  function applyJob(next: Job) {
    updateJob(reservationId, next);
  }

  function onTypeChange(typeId: string) {
    const nextType = activeTypes.find((item) => item.id === typeId);
    if (!nextType || nextType.id === currentJob.typeId) return;
    const hasTicks = currentJob.checklist.some((item) => item.done);
    if (hasTicks && !window.confirm("Replace the checklist with the new type’s defaults?")) return;
    applyJob(jobFromType(nextType, currentJob));
  }

  const markDoneBlocked = jobType.requiresTc && job.tcStatus !== "signed";
  const productsForType = jobType.productIds.length
    ? state.products.filter((product) => product.active && jobType.productIds.includes(product.id))
    : state.products.filter((product) => product.active);

  const preview = [
    jobType.name,
    WORK_BY_LABEL[job.workBy],
    job.status === "done" ? "Done" : "Open",
    job.liftTime ? `Lift ${job.liftTime}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/80" data-job-section>
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
          <div className="font-medium text-foreground text-sm">{state.settings.jobPanelTitle}</div>
          {!open ? (
            <p className="mt-0.5 line-clamp-2 break-words text-muted-foreground text-xs">{preview}</p>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-gray-200 border-t bg-white px-3 py-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Job type</span>
            <select
              value={job.typeId}
              onChange={(event) => onTypeChange(event.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            >
              {activeTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-neutral-500">Who does the work</span>
            <div className="flex flex-wrap gap-3">
              {(["marina", "diy", "contractor"] as WorkBy[]).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name={`work-by-${reservationId}`}
                    checked={job.workBy === value}
                    onChange={() =>
                      assignContractor(reservationId, value, value === "contractor" ? job.contractorName || "Marine Works" : undefined)
                    }
                  />
                  {WORK_BY_LABEL[value]}
                </label>
              ))}
            </div>
            {job.workBy === "contractor" ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={job.contractorName ?? ""}
                  onChange={(event) => assignContractor(reservationId, "contractor", event.target.value)}
                  placeholder="Contractor name"
                  className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                  data-contractor-name
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!job.contractorName}
                  onClick={() => {
                    notifyContractor(reservationId);
                    toast.success(`Notified ${job.contractorName}`);
                  }}
                >
                  Notify
                </Button>
              </div>
            ) : null}
          </div>

          {isBerth ? (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-500">Work location</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name={`job-location-${reservationId}`}
                    checked={job.location === "afloat"}
                    onChange={() => applyJob({ ...job, location: "afloat", liftTime: undefined, launchTime: undefined })}
                  />
                  Afloat (in the water)
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name={`job-location-${reservationId}`}
                    checked={job.location === "dockyard"}
                    onChange={() => applyJob({ ...job, location: "dockyard" })}
                  />
                  Lift to {state.settings.boatyardLabel}
                </label>
              </div>
            </div>
          ) : null}

          {job.location === "dockyard" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Lift time</span>
                <input
                  type="time"
                  value={job.liftTime ?? ""}
                  onChange={(event) => applyJob({ ...job, liftTime: event.target.value || undefined })}
                  className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Launch time</span>
                <input
                  type="time"
                  value={job.launchTime ?? ""}
                  onChange={(event) => applyJob({ ...job, launchTime: event.target.value || undefined })}
                  className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Work done afloat — no lift required.</p>
          )}

          {job.location === "dockyard" ? (
            <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3" data-relaunch-reschedule>
              <p className="text-xs font-medium text-neutral-500">Move relaunch (Boatyard Jenga)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={relaunchDate}
                  onChange={(event) => setRelaunchDate(event.target.value)}
                  className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={relaunchTime}
                  onChange={(event) => setRelaunchTime(event.target.value)}
                  className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!relaunchDate}
                onClick={() => {
                  rescheduleRelaunch(reservationId, relaunchDate, relaunchTime || undefined);
                  toast.success("Relaunch moved — reservation extended if needed");
                }}
              >
                Move relaunch
              </Button>
            </div>
          ) : null}

          {jobType.requiresTc ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500">T&Cs</p>
              <p className="text-sm font-medium text-neutral-900">
                {TC_LABEL[job.tcStatus]}
                {job.tcSignedAt ? (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    via portal {new Date(job.tcSignedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sendTc(reservationId);
                    toast.success("T&Cs sent — customer notified");
                  }}
                  disabled={job.tcStatus !== "not_sent"}
                  className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-800 disabled:text-neutral-400"
                >
                  Send T&Cs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyJob({ ...job, tcStatus: "signed", tcSignedAt: new Date().toISOString() });
                    toast.success("T&Cs marked signed (manual)");
                  }}
                  disabled={job.tcStatus === "signed"}
                  className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-800 disabled:text-neutral-400"
                >
                  Mark signed
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium text-neutral-500">Checklist</p>
            <ul className="mt-1.5 space-y-1">
              {job.checklist.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {
                        applyJob({
                          ...job,
                          checklist: job.checklist.map((entry, i) =>
                            i === index ? { ...entry, done: !entry.done } : entry
                          ),
                        });
                      }}
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {job.location === "dockyard" ? (
            <div>
              <p className="text-xs font-medium text-neutral-500">QA photos</p>
              <ul className="mt-1.5 space-y-1">
                {job.photos.map((photo) => (
                  <li key={photo.stage}>
                    <label className="flex items-center gap-2 text-sm text-neutral-800">
                      <input
                        type="checkbox"
                        checked={photo.done}
                        onChange={() => toggleJobPhoto(reservationId, photo.stage)}
                      />
                      {photo.stage === "lift_out" ? "Lift-out photo taken" : "Relaunch photo taken"}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <JobLines
            key={`${job.typeId}-hours`}
            title="Hours"
            lines={job.hours}
            products={state.products}
            catalog={productsForType}
            hidePrices={hidePrices}
            onAdd={(productId, qty) => addJobLine(reservationId, "hours", productId, qty)}
          />
          <JobLines
            key={`${job.typeId}-materials`}
            title="Materials"
            lines={job.materials}
            products={state.products}
            catalog={productsForType}
            hidePrices={hidePrices}
            onAdd={(productId, qty) => addJobLine(reservationId, "materials", productId, qty)}
          />

          <div className="space-y-2">
            {canCreateDraft ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const invoiceId = createDraftFromJob(reservationId);
                  toast.success(invoiceBannerText(draftFromJob(reservation, state.products, true)));
                  navigate(`/invoices/${invoiceId}`);
                }}
              >
                Create draft invoice
              </Button>
            ) : null}
            <Button
              type="button"
              variant="harbr"
              className="w-full"
              disabled={job.status === "done" || markDoneBlocked}
              onClick={() => {
                applyJob({ ...job, status: "done" });
                toast.success("Job marked done");
              }}
            >
              Mark job done
            </Button>
            {markDoneBlocked ? (
              <p className="text-xs text-neutral-500">T&Cs must be signed before the job can be marked done.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
