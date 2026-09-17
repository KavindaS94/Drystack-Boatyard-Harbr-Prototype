import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarGrid } from "../components/calendar/calendar-grid";
import { LiftWeekCalendar } from "../components/calendar/lift-week-calendar";
import { YardWeekCalendar } from "../components/calendar/yard-week-calendar";
import { JobsWorkspace } from "../components/jobs/jobs-workspace";
import { AddTaskModal } from "../components/launch/add-task-modal";
import { boardForDay, TaskList, type BoardTab } from "../components/launch/task-list";
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
  occupancyTabId,
  occupancyTabLabel,
} from "../lib/modules";
import { cn } from "../lib/utils";
import { EquipmentCalendarScreen } from "./equipment-calendar-screen";
import { useMarina } from "../store/marina-store";
import type { LandModule } from "../types/domain";

type WorkspaceTab = "today" | "equipment" | "occupancy" | "jobs";

interface LandModuleScreenProps {
  module: LandModule;
}

function isBoardTab(value: string | null): value is BoardTab {
  return value === "requests" || value === "launch" || value === "lift";
}

export function LandModuleScreen({ module }: LandModuleScreenProps) {
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const [params, setParams] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [slotTime, setSlotTime] = useState<string | undefined>();
  const label = moduleLabel(module, state.settings);
  const enabled = isKindEnabled(module, state.settings);
  const board = useMemo(
    () => boardForDay(state.launchTasks, state.taskTypes, state.selectedDate, module),
    [module, state.launchTasks, state.selectedDate, state.taskTypes]
  );
  const pending = board.totals.requests;
  const script = params.get("script");
  const requestedTab = params.get("tab");
  const equipmentId = equipmentTabId(module);

  const occupancyId = occupancyTabId(module);

  const tab: WorkspaceTab = useMemo(() => {
    if (requestedTab === equipmentId || requestedTab === "equipment") return "equipment";
    if (
      requestedTab === "occupancy" ||
      requestedTab === occupancyId ||
      requestedTab === "racks" ||
      requestedTab === "pads" ||
      requestedTab === "yard"
    ) {
      return "occupancy";
    }
    if (module === "boatyard" && (requestedTab === "jobs" || requestedTab === "job-details")) {
      return "jobs";
    }
    return "today";
  }, [equipmentId, module, occupancyId, requestedTab]);

  const boardTab = isBoardTab(requestedTab) ? requestedTab : undefined;

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
    else if (next === "jobs") nextParams.set("tab", "jobs");
    else nextParams.set("tab", occupancyId);
    setParams(nextParams, { replace: true });
  }

  function setBoardTab(next: BoardTab) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  if (!enabled) {
    return (
      <div className="p-6 text-sm text-neutral-600">
        Turn on {label} in Settings → Modules & words to use this workspace.
      </div>
    );
  }

  const tabs: { id: WorkspaceTab; label: string }[] =
    module === "boatyard"
      ? [
          { id: "today", label: "Today" },
          { id: "equipment", label: equipmentTabLabel(module) },
          { id: "occupancy", label: occupancyTabLabel(module) },
          { id: "jobs", label: "Job details" },
        ]
      : [
          { id: "today", label: "Today" },
          { id: "equipment", label: equipmentTabLabel(module) },
          { id: "occupancy", label: occupancyTabLabel(module) },
        ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-land-module={module}>
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{label}</h1>
            <p className={cn("mt-0.5 text-sm", pending > 0 ? "text-amber-700" : "text-muted-foreground")} data-pending-count>
              {pending === 1 ? "1 request" : `${pending} requests`}
              <span className="text-neutral-400"> · </span>
              {board.totals.lifts} lift
              <span className="text-neutral-400"> · </span>
              {board.totals.launches} launch
            </p>
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
                variant="harbr"
                size="sm"
                onClick={() => {
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
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1",
            tab === "jobs" ||
            (tab === "occupancy" && module === "boatyard") ||
            (tab === "equipment" && module === "boatyard")
              ? "overflow-hidden"
              : "overflow-auto"
          )}
        >
          {tab === "today" ? (
            <div className="space-y-4 p-4 sm:p-6" data-launch-board>
              <TaskList date={state.selectedDate} module={module} tab={boardTab} onTabChange={setBoardTab} />
            </div>
          ) : null}

          {tab === "occupancy" ? (
            module === "boatyard" ? (
              <YardWeekCalendar />
            ) : (
              <div className="p-4 sm:p-6">
                <CalendarGrid kinds={[module]} />
              </div>
            )
          ) : null}

          {tab === "jobs" ? <JobsWorkspace /> : null}

          {tab === "equipment" ? (
            module === "boatyard" ? (
              <LiftWeekCalendar
                onFreeSlot={(date, time) => {
                  setSelectedDate(date);
                  setSlotTime(time);
                  setIsAddOpen(true);
                }}
                onBookedReservation={(reservationId) => setSelectedReservationId(reservationId)}
              />
            ) : (
              <EquipmentCalendarScreen
                kind="fork_lift"
                embedded
                onFreeSlot={(time) => {
                  setSlotTime(time);
                  setIsAddOpen(true);
                }}
                onBookedReservation={(reservationId) => setSelectedReservationId(reservationId)}
              />
            )
          ) : null}
        </div>

        {tab !== "jobs" ? <ReservationPanel layout="page" allowedKinds={[module]} /> : null}
      </div>

      {isAddOpen ? (
        <AddTaskModal
          date={state.selectedDate}
          module={module}
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
