import { useLayoutEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TabletJob } from "../components/tablet/tablet-job";
import { DnlBadge } from "../components/dnl-badge";
import { TaskRow } from "../components/launch/task-row";
import { dnlStatus } from "../lib/dnl";
import { HARBR_STORY_ID } from "../lib/demo-story";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";
import type { Customer, LaunchTask, Reservation, Vessel } from "../types/domain";

function includesDay(reservation: Reservation, day: string): boolean {
  return reservation.startDate <= day && reservation.endDate >= day;
}

function matchesSearch(query: string, vessel: Vessel, customer: Customer): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (vessel.name.toLowerCase().includes(q)) return true;
  if (customer.name.toLowerCase().includes(q)) return true;
  return false;
}

function sortTasks(tasks: LaunchTask[]): LaunchTask[] {
  return tasks.slice().sort((a, b) => a.time.localeCompare(b.time));
}

export function YardCrewScreen() {
  const { state, setRole, setSelectedReservationId } = useMarina();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    if (state.role !== "yard") setRole("yard");
  }, [setRole, state.role]);

  useLayoutEffect(() => {
    const boat = params.get("boat");
    const res = params.get("res");
    if (boat) setQuery(boat);
    if (res && state.reservations.some((reservation) => reservation.id === res)) {
      setOpenId(res);
      setSelectedReservationId(res);
    }
  }, [params, setSelectedReservationId, state.reservations]);

  const day = state.selectedDate;
  const yardTasks = useMemo(() => {
    return sortTasks(
      state.launchTasks.filter((task) => {
        if (task.module !== "boatyard" || task.date !== day) return false;
        if (task.status === "declined" || task.status === "requested") return false;
        const vessel = state.vessels.find((item) => item.id === task.vesselId);
        const customer = state.customers.find((item) => item.id === task.customerId);
        if (!vessel || !customer) return false;
        return matchesSearch(query, vessel, customer);
      })
    );
  }, [day, query, state.customers, state.launchTasks, state.vessels]);

  const lifts = yardTasks.filter((task) => state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind === "retrieval");
  const launches = yardTasks.filter((task) => state.taskTypes.find((item) => item.id === task.taskTypeId)?.kind === "launch");

  const todaysJobs = useMemo(() => {
    if (!state.settings.boatyardEnabled) return [];
    return state.reservations
      .filter((reservation) => {
        if (!reservation.job || reservation.status === "archived") return false;
        const berth = state.berths.find((item) => item.id === reservation.berthId);
        if (berth?.kind !== "boatyard") return false;
        return includesDay(reservation, day);
      })
      .filter((reservation) => {
        const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
        const customer = state.customers.find((item) => item.id === reservation.customerId);
        if (!vessel || !customer) return false;
        return matchesSearch(query, vessel, customer);
      });
  }, [day, query, state.berths, state.customers, state.reservations, state.settings.boatyardEnabled, state.vessels]);

  if (!state.settings.boatyardEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div className="max-w-sm rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">Boatyard is not enabled</p>
          <p className="mt-2">Turn it on in Settings → Modules & words.</p>
          <Link to="/operations/calendar" className="mt-4 inline-block text-[hsl(252,75%,45%)]">
            Back to office
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen bg-neutral-200 px-4 py-8", params.get("story") === HARBR_STORY_ID && "pb-32")}
      data-yard-crew
    >
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-neutral-300 bg-neutral-300 p-3 shadow-inner">
        <div className="min-h-[32rem] overflow-y-auto rounded-[1.4rem] bg-white p-6">
          {openId ? (
            <TabletJob reservationId={openId} onBack={() => setOpenId(null)} />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-semibold text-neutral-900">Yard crew</h1>
                <Link to="/operations/calendar" className="text-xs font-medium text-[hsl(252,75%,45%)]">
                  Office
                </Link>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Boat or customer"
                  data-tablet-search
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </label>

              <CrewSection title="Lift">
                {lifts.length === 0 ? (
                  <p className="text-sm text-neutral-500">No lifts today.</p>
                ) : (
                  lifts.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isOpen={openTaskId === task.id}
                      error={errors[task.id]}
                      onToggleOpen={() => setOpenTaskId((current) => (current === task.id ? null : task.id))}
                      onError={(message) =>
                        setErrors((current) => {
                          if (!message) {
                            const next = { ...current };
                            delete next[task.id];
                            return next;
                          }
                          return { ...current, [task.id]: message };
                        })
                      }
                    />
                  ))
                )}
              </CrewSection>

              <CrewSection title="Repair jobs">
                {todaysJobs.length === 0 ? (
                  <p className="text-sm text-neutral-500">No yard jobs match.</p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {todaysJobs.map((reservation) => {
                      const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
                      const customer = state.customers.find((item) => item.id === reservation.customerId);
                      const berth = state.berths.find((item) => item.id === reservation.berthId);
                      const jobType = state.jobTypes.find((item) => item.id === reservation.job?.typeId);
                      if (!vessel || !customer || !berth) return null;
                      const dnl = dnlStatus(vessel, customer, state.settings);
                      return (
                        <li key={reservation.id}>
                          <button
                            type="button"
                            data-tablet-job-row={reservation.id}
                            onClick={() => {
                              setSelectedReservationId(reservation.id);
                              setOpenId(reservation.id);
                            }}
                            className="flex w-full flex-col items-start gap-0.5 py-3 text-left hover:bg-neutral-50"
                          >
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">{vessel.name}</span>
                              <DnlBadge status={dnl} />
                            </span>
                            <span className="text-xs text-neutral-500">
                              {customer.name} · {berth.name}
                              {jobType ? ` · ${jobType.name}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CrewSection>

              <CrewSection title="Launch">
                {launches.length === 0 ? (
                  <p className="text-sm text-neutral-500">No launches today.</p>
                ) : (
                  launches.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isOpen={openTaskId === task.id}
                      error={errors[task.id]}
                      onToggleOpen={() => setOpenTaskId((current) => (current === task.id ? null : task.id))}
                      onError={(message) =>
                        setErrors((current) => {
                          if (!message) {
                            const next = { ...current };
                            delete next[task.id];
                            return next;
                          }
                          return { ...current, [task.id]: message };
                        })
                      }
                    />
                  ))
                )}
              </CrewSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CrewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </section>
  );
}
