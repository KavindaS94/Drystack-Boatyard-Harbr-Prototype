import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarGrid } from "../components/calendar/calendar-grid";
import { AddTaskModal } from "../components/launch/add-task-modal";
import { TaskList } from "../components/launch/task-list";
import { ReservationPanel } from "../components/reservation-panel/reservation-panel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { resolveDemoReservationId } from "../lib/demo-scripts";
import {
  equipmentTabId,
  equipmentTabLabel,
  isKindEnabled,
  moduleLabel,
  occupancyTabLabel,
} from "../lib/modules";
import { cn } from "../lib/utils";
import { EquipmentCalendarScreen } from "./equipment-calendar-screen";
import { useMarina } from "../store/marina-store";
import type { LandModule } from "../types/domain";

type WorkspaceTab = "today" | "occupancy" | "equipment" | "jobs";

interface LandModuleScreenProps {
  module: LandModule;
}

export function LandModuleScreen({ module }: LandModuleScreenProps) {
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const [params, setParams] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [asRequest, setAsRequest] = useState(false);
  const [slotTime, setSlotTime] = useState<string | undefined>();
  const label = moduleLabel(module, state.settings);
  const enabled = isKindEnabled(module, state.settings);
  const pending = state.launchTasks.filter((task) => task.status === "requested" && task.module === module).length;
  const script = params.get("script");
  const requestedTab = params.get("tab");
  const equipmentId = equipmentTabId(module);

  const tab: WorkspaceTab = useMemo(() => {
    if (requestedTab === "occupancy" || requestedTab === "racks" || requestedTab === "pads") return "occupancy";
    if (requestedTab === "jobs") return "jobs";
    if (requestedTab === equipmentId || requestedTab === "equipment") return "equipment";
    return "today";
  }, [equipmentId, requestedTab]);

  useEffect(() => {
    if (script === "saturday") setSelectedDate(DEMO_SATURDAY);
    else if (script === "rack") setSelectedDate(DEMO_FRIDAY);
  }, [script, setSelectedDate]);

  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const reservationId = resolveDemoReservationId(stateRef.current, {
      script: params.get("script"),
      boat: params.get("boat"),
      res: params.get("res"),
      kind: module,
    });
    if (reservationId) setSelectedReservationId(reservationId);
    else if (params.get("story") && !params.get("res") && !params.get("boat")) {
      setSelectedReservationId(null);
    }
  }, [params, setSelectedReservationId]);

  function setTab(next: WorkspaceTab) {
    const nextParams = new URLSearchParams(params);
    if (next === "today") nextParams.delete("tab");
    else if (next === "equipment") nextParams.set("tab", equipmentId);
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  if (!enabled) {
    return (
      <div className="p-6 text-sm text-neutral-600">
        Turn on {label} in Settings → Modules & words to use this workspace.
      </div>
    );
  }

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "occupancy", label: occupancyTabLabel(module) },
    { id: "equipment", label: equipmentTabLabel(module) },
    ...(module === "boatyard" ? [{ id: "jobs" as const, label: "Jobs" }] : []),
  ];

  const jobs = state.reservations.filter((reservation) => {
    if (reservation.status === "archived" || !reservation.job) return false;
    const berth = state.berths.find((item) => item.id === reservation.berthId);
    return berth?.kind === "boatyard";
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-land-module={module}>
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{label}</h1>
            {pending > 0 ? (
              <p className="mt-0.5 text-sm text-amber-700" data-pending-count>
                {pending} request{pending === 1 ? "" : "s"} waiting
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Daily board, occupancy, and {equipmentTabLabel(module).toLowerCase()} in one place.
              </p>
            )}
          </div>
          {tab === "today" ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="text-xs font-medium text-neutral-500">Date</span>
                <Input
                  type="date"
                  value={state.selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  data-launch-date
                  className="h-8 w-auto"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAsRequest(true);
                  setSlotTime(undefined);
                  setIsAddOpen(true);
                }}
                data-log-request
              >
                Log request
              </Button>
              <Button
                type="button"
                variant="harbr"
                size="sm"
                onClick={() => {
                  setAsRequest(false);
                  setSlotTime(undefined);
                  setIsAddOpen(true);
                }}
                data-add-task
              >
                Add task
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              data-workspace-tab={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                tab === item.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          {tab === "today" ? (
            <div className="space-y-4 p-4 sm:p-6" data-launch-board>
              <TaskList date={state.selectedDate} module={module} />
            </div>
          ) : null}

          {tab === "occupancy" ? (
            <div className="p-4 sm:p-6">
              <CalendarGrid kinds={[module]} />
            </div>
          ) : null}

          {tab === "equipment" ? (
            <EquipmentCalendarScreen
              kind={module === "boatyard" ? "travel_lift" : "fork_lift"}
              embedded
              onFreeSlot={(time) => {
                setAsRequest(false);
                setSlotTime(time);
                setIsAddOpen(true);
              }}
              onBookedReservation={(reservationId) => setSelectedReservationId(reservationId)}
            />
          ) : null}

          {tab === "jobs" ? (
            <div className="space-y-3 p-4 sm:p-6" data-jobs-list>
              {jobs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                  No open repair jobs on pads.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {jobs.map((reservation) => {
                    const vessel = state.vessels.find((item) => item.id === reservation.vesselId);
                    const customer = state.customers.find((item) => item.id === reservation.customerId);
                    const berth = state.berths.find((item) => item.id === reservation.berthId);
                    const jobType = state.jobTypes.find((item) => item.id === reservation.job?.typeId);
                    return (
                      <li key={reservation.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedReservationId(reservation.id)}
                          data-job-row={reservation.id}
                          className={cn(
                            "flex h-full w-full flex-col items-start rounded-xl border bg-white p-4 text-left shadow-sm",
                            state.selectedReservationId === reservation.id
                              ? "border-neutral-900"
                              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                          )}
                        >
                          <span className="text-base font-semibold text-neutral-900">{vessel?.name}</span>
                          <span className="mt-1 text-sm text-neutral-600">{customer?.name}</span>
                          <span className="mt-2 text-sm text-neutral-500">
                            <span className="font-medium text-neutral-800">{berth?.name}</span>
                            {jobType ? ` · ${jobType.name}` : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <ReservationPanel layout="page" allowedKinds={[module]} />
      </div>

      {isAddOpen ? (
        <AddTaskModal
          date={state.selectedDate}
          module={module}
          asRequest={asRequest}
          initialTime={slotTime}
          onClose={() => {
            setIsAddOpen(false);
            setSlotTime(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
