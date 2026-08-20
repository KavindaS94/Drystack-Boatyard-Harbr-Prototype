import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { draftFromJob, invoiceBannerText } from "../../lib/invoice";
import { useMarina } from "../../store/marina-store";
import type { Job, JobType, TcStatus } from "../../types/domain";
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

function checklistFromType(jobType: JobType): Job["checklist"] {
  return jobType.checklist.map((label) => ({ label, done: false }));
}

function jobFromType(jobType: JobType, previous?: Job): Job {
  return {
    typeId: jobType.id,
    location: previous?.location ?? "dockyard",
    liftTime: previous?.liftTime,
    launchTime: previous?.launchTime,
    tcStatus: previous?.tcStatus ?? "not_sent",
    checklist: checklistFromType(jobType),
    hours: previous?.hours ?? [],
    materials: previous?.materials ?? [],
    status: previous?.status ?? "open",
  };
}

export function JobPanel({ reservationId }: JobPanelProps) {
  const navigate = useNavigate();
  const { state, updateJob, addJobLine, createDraftFromJob } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const berth = state.berths.find((item) => item.id === reservation?.berthId);
  const job = reservation?.job;
  const jobType = state.jobTypes.find((item) => item.id === job?.typeId);
  const activeTypes = state.jobTypes.filter((item) => item.active);
  // A berth job can be done afloat or lifted; a dockyard reservation is always lifted.
  const isBerth = berth?.kind === "wet";
  const hidePrices = state.role === "yard" && state.settings.hidePricesForYard;
  const canCreateDraft = state.role === "office";

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

  return (
    <section className="space-y-4 border-t border-neutral-200 pt-4" data-job-section>
      <h2 className="text-sm font-semibold text-neutral-900">{state.settings.jobPanelTitle}</h2>

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

      {jobType.requiresTc ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500">T&Cs</p>
          <p className="text-sm font-medium text-neutral-900">{TC_LABEL[job.tcStatus]}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                applyJob({ ...job, tcStatus: "sent" });
                toast.success("T&Cs sent");
              }}
              disabled={job.tcStatus !== "not_sent"}
              className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-800 disabled:text-neutral-400"
            >
              Send T&Cs
            </button>
            <button
              type="button"
              onClick={() => {
                applyJob({ ...job, tcStatus: "signed" });
                toast.success("T&Cs signed");
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
    </section>
  );
}
