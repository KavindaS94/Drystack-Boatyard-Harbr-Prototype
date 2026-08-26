import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { DEMO_ROUTINE_GROUPS, DEMO_ROUTINES, type DemoRoutineGroup } from "../lib/demo-routines";
import { resolveDemoReservationId } from "../lib/demo-scripts";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";

type Filter = "all" | DemoRoutineGroup;

export function DemoRoutinesScreen() {
  const navigate = useNavigate();
  const { state, resetDemo, setSelectedDate, setSelectedReservationId } = useMarina();
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(
    () =>
      DEMO_ROUTINE_GROUPS.map((group) => ({
        ...group,
        routines: DEMO_ROUTINES.filter((item) => item.group === group.id),
      })).filter((group) => filter === "all" || group.id === filter),
    [filter]
  );

  function prepareAndGo(to: string) {
    const url = new URL(to, window.location.origin);
    const script = url.searchParams.get("script");
    const boat = url.searchParams.get("boat");
    if (script === "saturday") setSelectedDate(DEMO_SATURDAY);
    else if (script === "rack" || script === "dnl") setSelectedDate(DEMO_FRIDAY);
    const reservationId = resolveDemoReservationId(state, { script, boat });
    if (reservationId) setSelectedReservationId(reservationId);
    navigate(`${url.pathname}${url.search}`);
  }

  function onReset() {
    if (!window.confirm("Reset the demo to the starting data? Your click-through progress will be cleared.")) {
      return;
    }
    resetDemo();
    toast.success("Demo reset to starting data");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6" data-demo-routines>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Demo routines</h1>
        <p className="mt-1 text-sm text-neutral-600">
          All data is fake. You land on the Calendar. Skip grey menu items — they are not in this prototype.
          Use two browser tabs when the owner is involved. If a boat is already moved, Reset demo and start again.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onReset}>
            Reset demo
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {(
          [
            { id: "all", label: "All" },
            { id: "dry", label: "Dry stack" },
            { id: "yard", label: "Boatyard" },
            { id: "office", label: "Office & portal" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
              filter === item.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{group.title}</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{group.intro}</p>
          </div>
          {group.routines.map((routine, index) => (
            <Card key={routine.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {index + 1}. {routine.title}
                </CardTitle>
                <CardDescription>{routine.why}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">
                  {routine.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-2">
                  {routine.newTab ? (
                    <a
                      href={routine.to}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center rounded-md bg-[hsl(252,75%,70%)] px-4 text-sm text-white hover:bg-[hsl(252,75%,60%)]"
                    >
                      {routine.openLabel}
                    </a>
                  ) : (
                    <Button type="button" size="sm" variant="harbr" onClick={() => prepareAndGo(routine.to)}>
                      {routine.openLabel}
                    </Button>
                  )}
                  {routine.extra ? (
                    routine.extra.newTab ? (
                      <a
                        href={routine.extra.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center rounded-md border border-[hsl(252,75%,70%)] px-4 text-sm text-[hsl(252,75%,70%)] hover:bg-[hsl(252,75%,99%)]"
                      >
                        {routine.extra.label}
                      </a>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="harbrOutline"
                        onClick={() => prepareAndGo(routine.extra!.href)}
                      >
                        {routine.extra.label}
                      </Button>
                    )
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ))}

      <p className="text-center text-xs text-neutral-500">
        Portal shortcuts:{" "}
        <Link to="/portal/demo-pelican-portal" className="text-[hsl(252,75%,55%)] underline" target="_blank">
          Pelican
        </Link>
        {" · "}
        <Link to="/portal/demo-tern-portal" className="text-[hsl(252,75%,55%)] underline" target="_blank">
          Tern
        </Link>
        {" · "}
        <Link to="/portal/demo-heron-portal" className="text-[hsl(252,75%,55%)] underline" target="_blank">
          Heron
        </Link>
      </p>
    </div>
  );
}
