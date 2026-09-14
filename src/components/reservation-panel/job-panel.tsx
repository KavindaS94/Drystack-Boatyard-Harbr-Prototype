import { Check, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EditableChecklist } from "../checklist/editable-checklist";
import { itemsFromOptions, photosFromOptions } from "../../lib/checklist";
import { buildDaySlots, equipmentForModule } from "../../lib/equipment";
import { draftFromJob, invoiceBannerText } from "../../lib/invoice";
import { remapTravelLiftJobTypeId, workJobTypes } from "../../lib/job-types";
import { spaceKindToModule } from "../../lib/modules";
import { useMarina } from "../../store/marina-store";
import type { Job, JobType, TcStatus, WorkBy } from "../../types/domain";
import { Button } from "../ui/button";
import { JobLines } from "./job-lines";

interface JobPanelProps {
  reservationId: string;
  plain?: boolean;
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
    checklist: itemsFromOptions(jobType.checklist),
    photos: photosFromOptions(jobType.photoChecklist),
    hours: previous?.hours ?? [],
    materials: previous?.materials ?? [],
    status: previous?.status ?? "open",
  };
}

export function JobPanel({ reservationId, plain = false }: JobPanelProps) {
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
  } = useMarina();
  const reservation = state.reservations.find((item) => item.id === reservationId);
  const job = reservation?.job;
  const resolvedTypeId = job ? remapTravelLiftJobTypeId(job.typeId) : undefined;
  const jobType = state.jobTypes.find((item) => item.id === resolvedTypeId);
  const activeTypes = workJobTypes(state.jobTypes).filter((item) => item.active);
  const hidePrices = state.role === "yard" && state.settings.hidePricesForYard;
  const canCreateDraft = state.role === "office";
  const reservationBerth = reservation
    ? state.berths.find((item) => item.id === reservation.berthId)
    : undefined;
  const module = reservationBerth ? spaceKindToModule(reservationBerth.kind) : "boatyard";
  const liftMachine = module ? equipmentForModule(state.equipment, module) : undefined;
  const liftSlots = liftMachine ? buildDaySlots(liftMachine) : [];
  const liftTask = state.launchTasks.find(
    (item) =>
      item.reservationId === reservationId &&
      (!module || item.module === module) &&
      state.taskTypes.find((type) => type.id === item.taskTypeId)?.kind === "retrieval"
  );
  const launchTask = state.launchTasks.find(
    (item) =>
      item.reservationId === reservationId &&
      (!module || item.module === module) &&
      item.status !== "declined" &&
      item.status !== "done" &&
      state.taskTypes.find((type) => type.id === item.taskTypeId)?.kind === "launch"
  );
  const liftTimeLabel = liftTask?.time ?? job?.liftTime;

  const [open, setOpen] = useState(true);
  const [relaunchDate, setRelaunchDate] = useState(job?.launchDate ?? reservation?.endDate ?? "");
  const [relaunchTime, setRelaunchTime] = useState(job?.launchTime ?? "");

  useEffect(() => {
    setOpen(true);
    setRelaunchDate(job?.launchDate ?? reservation?.endDate ?? "");
    setRelaunchTime(job?.launchTime ?? launchTask?.time ?? "");
  }, [reservationId, job?.launchDate, job?.launchTime, launchTask?.time, reservation?.endDate]);

  useEffect(() => {
    if (!relaunchTime && liftSlots[0]) setRelaunchTime(liftSlots[0]);
  }, [relaunchTime, liftSlots]);

  if (!reservation || !job || !jobType) return null;
  const currentJob = job;

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

  const preview = [
    jobType.name,
    WORK_BY_LABEL[job.workBy],
    job.status === "done" ? "Done" : "Open",
    job.liftTime ? `Lift ${job.liftTime}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className={plain ? "min-w-0 space-y-4" : "min-w-0 rounded-lg border border-gray-200 bg-gray-50/80"}
      data-job-section
    >
      {plain ? (
        <h3 className="text-sm font-semibold text-neutral-900">{state.settings.jobPanelTitle}</h3>
      ) : (
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
      )}

      {plain || open ? (
        <div className={plain ? "space-y-4" : "space-y-4 border-gray-200 border-t bg-white px-3 py-3"}>
          <div
            className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3"
            data-lift-then-launch
            data-relaunch-reschedule
          >
            <div>
              <p className="text-xs font-medium text-neutral-500">Lift then launch</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Every land stay lifts first, does the job, then launches.
              </p>
            </div>
            <p className="text-xs text-neutral-600">
              Lift{" "}
              <span className="font-medium text-neutral-900">
                {liftTimeLabel ? liftTimeLabel : "not yet scheduled"}
              </span>
              {liftTask?.status === "done" ? " · done" : liftTask ? " · scheduled" : ""}
            </p>
            <p className="text-xs font-medium text-neutral-500">
              {launchTask ? "Move launch date" : "Schedule launch"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={relaunchDate}
                onChange={(event) => setRelaunchDate(event.target.value)}
                className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
              {liftSlots.length > 0 ? (
                <select
                  value={relaunchTime}
                  onChange={(event) => setRelaunchTime(event.target.value)}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                >
                  {liftSlots.map((slot) => {
                    const taken = state.equipmentBookings.some(
                      (booking) =>
                        booking.equipmentId === liftMachine?.id &&
                        booking.date === relaunchDate &&
                        booking.startTime === slot &&
                        booking.taskId !== launchTask?.id
                    );
                    return (
                      <option key={slot} value={slot} disabled={taken}>
                        {slot}
                        {taken ? " — taken" : ""}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="time"
                  value={relaunchTime}
                  onChange={(event) => setRelaunchTime(event.target.value)}
                  className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
                />
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!relaunchDate}
              onClick={() => {
                const ok = rescheduleRelaunch(reservationId, relaunchDate, relaunchTime || undefined);
                if (!ok) {
                  toast.error("That lift slot is taken — pick another time");
                  return;
                }
                toast.success(
                  launchTask ? "Launch moved — customer emailed" : "Launch scheduled — customer emailed"
                );
              }}
            >
              {launchTask ? "Move launch date" : "Schedule launch"}
            </Button>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-500">Job type</span>
            <select
              value={resolvedTypeId}
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

          {jobType.requiresTc ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500">T&Cs</p>
              <p className="text-sm font-medium text-neutral-900">
                {TC_LABEL[job.tcStatus]}
                {job.tcSignedAt ? (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    via email {new Date(job.tcSignedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    sendTc(reservationId);
                    toast.success("T&Cs emailed — mark signed when the customer replies");
                  }}
                  disabled={job.tcStatus !== "not_sent"}
                >
                  Send T&Cs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    applyJob({ ...job, tcStatus: "signed", tcSignedAt: new Date().toISOString() });
                    toast.success("T&Cs marked signed (manual)");
                  }}
                  disabled={job.tcStatus === "signed"}
                >
                  Mark signed
                </Button>
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium text-neutral-500">Checklist</p>
            <div className="mt-1.5">
              <EditableChecklist
                items={job.checklist}
                categories={state.settings.checklistCategories}
                fallbackCategory="Yard job"
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
                categories={state.settings.checklistCategories}
                fallbackCategory="QA photo"
                onChange={(photos) =>
                  applyJob({
                    ...job,
                    photos: photos.map((item) => ({
                      id: item.id ?? `photo-${crypto.randomUUID()}`,
                      label: item.label,
                      category: item.category,
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
            kind="hours"
            lines={job.hours}
            products={state.products}
            catalog={productsForType}
            hidePrices={hidePrices}
            onAdd={(productId, qty) => addJobLine(reservationId, "hours", productId, qty)}
          />
          <JobLines
            key={`${job.typeId}-materials`}
            title="Materials"
            kind="materials"
            lines={job.materials}
            products={state.products}
            catalog={productsForType}
            hidePrices={hidePrices}
            onAdd={(productId, qty) => addJobLine(reservationId, "materials", productId, qty)}
          />

          <div className="space-y-2 border-t border-neutral-200 pt-3">
            {job.status === "done" ? (
              <div className="flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
                <Check className="h-4 w-4 shrink-0" />
                Job done
              </div>
            ) : (
              <>
                {markDoneBlocked ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                    T&Cs must be signed before this job can be marked done. Send or mark them signed above.
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="harbr"
                  className="w-full disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-100"
                  disabled={markDoneBlocked}
                  title={markDoneBlocked ? "T&Cs must be signed first" : undefined}
                  onClick={() => {
                    applyJob({ ...job, status: "done" });
                    toast.success("Job marked done");
                  }}
                >
                  Mark job done
                </Button>
              </>
            )}
            {canCreateDraft ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const includeDockyardFee = job.location === "dockyard";
                  const previewLines = draftFromJob(reservation, state.products, includeDockyardFee);
                  if (previewLines.length === 0) {
                    toast.error("Add hours or materials first");
                    return;
                  }
                  const invoiceId = createDraftFromJob(reservationId);
                  if (!invoiceId) {
                    toast.error("Add hours or materials first");
                    return;
                  }
                  toast.success(invoiceBannerText(previewLines));
                  navigate(`/invoices/${invoiceId}`);
                }}
              >
                <FileText className="h-4 w-4" />
                Create draft invoice
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
