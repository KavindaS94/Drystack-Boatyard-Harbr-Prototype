import { useMemo, useState } from "react";
import { TabletJob } from "../components/tablet/tablet-job";
import { DnlBadge } from "../components/dnl-badge";
import { DEMO_TODAY } from "../lib/demo-dates";
import { dnlStatus } from "../lib/dnl";
import { useMarina } from "../store/marina-store";
import type { Customer, Reservation, Vessel } from "../types/domain";

function includesDay(reservation: Reservation, day: string): boolean {
  return reservation.startDate <= day && reservation.endDate >= day;
}

function matchesSearch(query: string, vessel: Vessel, customer: Customer): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (vessel.name.toLowerCase().includes(q)) return true;
  if (customer.name.toLowerCase().includes(q)) return true;
  if (String(vessel.lengthM).toLowerCase().includes(q)) return true;
  return String(Math.floor(vessel.lengthM)) === q || String(Math.round(vessel.lengthM)) === q;
}

function liftSortKey(job: Reservation["job"]): string {
  return job?.liftTime ?? "99:99";
}

export function YardTabletScreen() {
  const { state, setSelectedReservationId } = useMarina();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const todaysJobs = useMemo(() => {
    if (!state.settings.boatyardEnabled) return [];

    return state.reservations
      .filter((reservation) => {
        if (!reservation.job) return false;
        const berth = state.berths.find((item) => item.id === reservation.berthId);
        if (berth?.kind !== "boatyard") return false;
        return includesDay(reservation, DEMO_TODAY) || includesDay(reservation, state.selectedDate);
      })
      .filter((reservation) => {
        const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
        const customer = state.customers.find((item) => item.id === reservation.customerId);
        if (!vessel || !customer) return false;
        return matchesSearch(query, vessel, customer);
      })
      .sort((a, b) => liftSortKey(a.job).localeCompare(liftSortKey(b.job)));
  }, [query, state.berths, state.customers, state.reservations, state.selectedDate, state.settings.boatyardEnabled, state.vessels]);

  function openJob(reservationId: string) {
    setSelectedReservationId(reservationId);
    setOpenId(reservationId);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-neutral-200 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-neutral-300 bg-neutral-300 p-3 shadow-inner">
        <div className="min-h-[32rem] overflow-y-auto rounded-[1.4rem] bg-white p-6">
          {openId ? (
            <TabletJob reservationId={openId} onBack={() => setOpenId(null)} />
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-neutral-900">Yard tablet</h1>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-500">Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Boat name, customer name, or size"
                  data-tablet-search
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </label>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Today’s yard Jobs</p>
                {todaysJobs.length === 0 ? (
                  <p className="mt-2 text-sm text-neutral-500">No yard jobs match.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-neutral-100">
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
                            onClick={() => openJob(reservation.id)}
                            className="flex w-full flex-col items-start gap-0.5 py-3 text-left hover:bg-neutral-50"
                          >
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">{vessel.name}</span>
                              <DnlBadge status={dnl} />
                            </span>
                            <span className="text-xs text-neutral-500">
                              {customer.name} · {berth.name}
                              {jobType ? ` · ${jobType.name}` : ""}
                              {reservation.job?.liftTime ? ` · Lift ${reservation.job.liftTime}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
