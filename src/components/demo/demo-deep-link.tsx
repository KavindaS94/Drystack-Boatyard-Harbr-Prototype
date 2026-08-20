import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createSeedState } from "../../data/seed";
import { resolveDemoReservationId } from "../../lib/demo-scripts";
import { useMarina } from "../../store/marina-store";

/** Applies `?script=` / `?boat=` so a presenter can jump to a walkthrough boat. */
export function DemoDeepLink() {
  const [params] = useSearchParams();
  const { state, setSelectedDate, setSelectedReservationId } = useMarina();
  const stateRef = useRef(state);
  stateRef.current = state;

  const script = params.get("script");
  const boat = params.get("boat");

  useEffect(() => {
    if (script === "saturday") {
      setSelectedDate(createSeedState().selectedDate);
      return;
    }

    const reservationId = resolveDemoReservationId(stateRef.current, { script, boat });
    if (reservationId) setSelectedReservationId(reservationId);
  }, [script, boat, setSelectedDate, setSelectedReservationId]);

  return null;
}
