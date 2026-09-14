import { Navigate } from "react-router-dom";
import { firstLandModulePath } from "../lib/modules";
import { useMarina } from "../store/marina-store";

export function LaunchBoardRedirect() {
  const { state } = useMarina();
  return <Navigate to={firstLandModulePath(state.settings)} replace />;
}

export function TravelLiftRedirect() {
  const { state } = useMarina();
  if (!state.settings.boatyardEnabled) {
    return <Navigate to={firstLandModulePath(state.settings)} replace />;
  }
  return <Navigate to="/operations/boatyard?tab=travel-lift" replace />;
}

export function ForkLiftRedirect() {
  const { state } = useMarina();
  if (state.settings.dryStorageEnabled) {
    return <Navigate to="/operations/dry-stack?tab=fork-lift" replace />;
  }
  if (state.settings.hardstandEnabled) {
    return <Navigate to="/operations/hardstand?tab=fork-lift" replace />;
  }
  return <Navigate to={firstLandModulePath(state.settings)} replace />;
}
