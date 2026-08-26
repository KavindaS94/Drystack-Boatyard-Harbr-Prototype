import { DnlBadge } from "../dnl-badge";
import { EditableChecklist } from "../checklist/editable-checklist";
import { itemsFromLabels, photosFromLabels } from "../../lib/checklist";
import { dnlStatus } from "../../lib/dnl";
import { useMarina } from "../../store/marina-store";
import type { Job, JobType, TcStatus } from "../../types/domain";
import { JobLines } from "../reservation-panel/job-lines";
import { toast } from "sonner";

interface TabletJobProps {
  reservationId: string;
  onBack: () => void;
}

const TC_LABEL: Record<TcStatus, string> = {
  not_sent: "Not sent",
  sent: "Sent",
  signed: "Signed",
};

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
    checklist: itemsFromLabels(jobType.checklist),
    photos: photosFromLabels(jobType.photoChecklist),
    hours: previous?.hours ?? [],
    materials: previous?.materials ?? [],
    status: previous?.status ?? "open",
  };
}

export function TabletJob({ reservationId, onBack }: TabletJobProps) {
  const { state, updateJob, addJobLine } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const job = reservation?.job;
  const jobType = state.jobTypes.find((item) => item.id === job?.typeId);
  const vessel = state.vessels.find((item) => item.id === reservation?.vesselId);
  const customer = state.customers.find((item) => item.id === reservation?.customerId);
  const berth = state.berths.find((item) => item.id === reservation?.berthId);
  const activeTypes = state.jobTypes.filter((item) => item.active);
  const hidePrices = state.settings.hidePricesForYard;

  if (!reservation || !job || !jobType || !vessel || !customer || !berth) return null;
  const currentJob = job;
  const dnl = dnlStatus(vessel, customer, state.settings);

  function applyJob(next: Job) {
    updateJob(reservationId, next);
  }

  function onTypeChange(typeId: string) {
    const nextType = activeTypes.find((item) => item.id === typeId);
    if (!nextType || nextType.id === currentJob.typeId) return;
    const hasTicks =
      currentJob.checklist.some((item) => item.done) || currentJob.photos.some((item) => item.done);
    if (hasTicks && !window.confirm("Replace the checklist and photos with the new type’s defaults?")) return;
    applyJob(jobFromType(nextType, currentJob));
  }

  const markDoneBlocked = jobType.requiresTc && job.tcStatus !== "signed";
  const productsForType = jobType.productIds.length
    ? state.products.filter((product) => product.active && jobType.productIds.includes(product.id))
    : state.products.filter((product) => product.active);

  return (
    <section className="space-y-4" data-job-section data-tablet-job={reservationId}>
      <button type="button" onClick={onBack} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        ← Today’s yard Jobs
      </button>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{vessel.name}</h2>
        <p className="text-sm text-neutral-500">
          {customer.name} · {berth.name}
          {job.liftTime ? ` · Lift ${job.liftTime}` : ""}
          {job.workBy === "contractor" && job.contractorName ? ` · ${job.contractorName}` : ""}
          {job.workBy === "diy" ? " · DIY" : ""}
        </p>
        <div className="mt-2">
          <DnlBadge status={dnl} />
        </div>
      </div>

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

      {jobType.requiresTc ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500">T&Cs</p>
          <p className="text-sm font-medium text-neutral-900">{TC_LABEL[job.tcStatus]}</p>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-neutral-500">Checklist</p>
        <div className="mt-1.5">
          <EditableChecklist
            items={job.checklist}
            onChange={(checklist) => applyJob({ ...job, checklist })}
            addLabel="Add checklist item"
            emptyHint="No items — add the checks for this job."
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500">QA photos</p>
        <div className="mt-1.5">
          <EditableChecklist
            items={job.photos}
            prefix="📷"
            onChange={(photos) =>
              applyJob({
                ...job,
                photos: photos.map((item) => ({
                  id: item.id ?? `photo-${crypto.randomUUID()}`,
                  label: item.label,
                  done: item.done,
                })),
              })
            }
            addLabel="Add photo item"
            emptyHint="No photo prompts — add any this job needs."
          />
        </div>
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
        <button
          type="button"
          disabled={job.status === "done" || markDoneBlocked}
          onClick={() => {
            applyJob({ ...job, status: "done" });
            toast.success("Job marked done");
          }}
          className="w-full rounded-md bg-[hsl(252,75%,70%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(252,75%,60%)] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          Mark job done
        </button>
        {markDoneBlocked ? (
          <p className="text-xs text-neutral-500">T&Cs must be signed before the job can be marked done.</p>
        ) : null}
      </div>
    </section>
  );
}
