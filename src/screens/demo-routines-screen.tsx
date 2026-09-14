import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { DEMO_ROUTINE_GROUPS, DEMO_ROUTINES, type DemoRoutineGroup } from "../lib/demo-routines";
import { kindFromPath, resolveDemoReservationId } from "../lib/demo-scripts";
import { HARBR_STORY, HARBR_STORY_BEATS, storyBeatUrl } from "../lib/demo-story";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";

type Filter = "all" | DemoRoutineGroup;

export function DemoRoutinesScreen() {
  const navigate = useNavigate();
  const { state, resetDemo, setSelectedDate, setSelectedReservationId } = useMarina();
  const [filter, setFilter] = useState<Filter>("all");
  const [showMore, setShowMore] = useState(false);

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
    const res = url.searchParams.get("res");
    if (script === "saturday") setSelectedDate(DEMO_SATURDAY);
    else if (script === "rack" || script === "dnl" || url.searchParams.get("story")) {
      setSelectedDate(DEMO_FRIDAY);
    }
    const reservationId = resolveDemoReservationId(state, {
      script,
      boat,
      res,
      kind: kindFromPath(url.pathname),
    });
    if (reservationId) setSelectedReservationId(reservationId);
    else if (url.searchParams.get("story")) setSelectedReservationId(null);
    navigate(`${url.pathname}${url.search}`);
  }

  function onReset() {
    if (!window.confirm("Reset the demo to the starting data? Your click-through progress will be cleared.")) {
      return;
    }
    resetDemo();
    toast.success("Demo reset to starting data");
  }

  function startStory() {
    resetDemo();
    toast.success("Demo reset — Elena Voss just called");
    navigate(storyBeatUrl(HARBR_STORY_BEATS[0]));
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6" data-demo-routines data-demo-story>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Demo story</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{HARBR_STORY.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{HARBR_STORY.intro}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="harbr" onClick={startStory} data-start-story>
              Reset and start story
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onReset}>
              Reset demo
            </Button>
          </div>
        </div>

        <ol className="space-y-3">
          {HARBR_STORY_BEATS.map((beat, index) => (
            <li key={beat.id}>
              <Card className="shadow-sm" data-story-card={beat.id}>
                <CardHeader className="pb-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {index + 1} · {beat.chapter}
                  </p>
                  <CardTitle className="text-base">{beat.title}</CardTitle>
                  <CardDescription>{beat.story}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium text-neutral-900">Do: </span>
                    {beat.do}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="harbr"
                    data-story-open={beat.id}
                    onClick={() => prepareAndGo(storyBeatUrl(beat))}
                  >
                    {beat.openLabel}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <div className="border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => setShowMore((current) => !current)}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            {showMore ? "Hide extra scenes" : "More scenes"}
          </button>
        </div>

        {showMore ? (
          <>
            <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "dry", label: "Dry stack" },
                  { id: "yard", label: "Boatyard" },
                  { id: "office", label: "Office" },
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
                {group.routines.map((routine) => (
                  <Card key={routine.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{routine.title}</CardTitle>
                      <CardDescription>{routine.why}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">
                        {routine.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="harbr" onClick={() => prepareAndGo(routine.to)}>
                          {routine.openLabel}
                        </Button>
                        {routine.extra ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="harbrOutline"
                            onClick={() => prepareAndGo(routine.extra!.href)}
                          >
                            {routine.extra.label}
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            ))}
          </>
        ) : null}

        <p className="text-center text-xs text-neutral-500">
          Yard crew is a separate page — user menu → Open yard crew, or{" "}
          <Link to="/yard" className="text-[hsl(252,75%,55%)] underline">
            /yard
          </Link>
          . Customer updates are email only.
        </p>
      </div>
    </div>
  );
}
