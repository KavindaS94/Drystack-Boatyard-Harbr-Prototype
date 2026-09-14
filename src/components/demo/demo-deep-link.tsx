import { useLayoutEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../../lib/demo-dates";
import { kindFromPath, resolveDemoReservationId } from "../../lib/demo-scripts";
import { HARBR_STORY_ID } from "../../lib/demo-story";
import { useMarina } from "../../store/marina-store";

/** Applies `?res=` / `?script=` / `?boat=` so a story beat lands on the right boat. */
export function DemoDeepLink() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const stateRef = useRef(state);
  stateRef.current = state;

  const script = params.get("script");
  const boat = params.get("boat");
  const res = params.get("res");
  const storyOn = params.get("story") === HARBR_STORY_ID;
  const kind = kindFromPath(location.pathname);

  useLayoutEffect(() => {
    if (script === "saturday") setSelectedDate(DEMO_SATURDAY);
    else if (script === "rack" || storyOn) setSelectedDate(DEMO_FRIDAY);

    const reservationId = resolveDemoReservationId(stateRef.current, { script, boat, res, kind });
    if (reservationId) setSelectedReservationId(reservationId);
    else if (storyOn) setSelectedReservationId(null);
  }, [script, boat, res, kind, storyOn, setSelectedDate, setSelectedReservationId]);

  return null;
}
