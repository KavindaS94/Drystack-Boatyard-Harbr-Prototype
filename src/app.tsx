import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/app-shell";
import { CalendarScreen } from "./screens/calendar-screen";
import { DraftInvoiceScreen } from "./screens/draft-invoice-screen";
import { ActionsScreen } from "./screens/actions-screen";
import { DemoRoutinesScreen } from "./screens/demo-routines-screen";
import { ForkLiftRedirect, LaunchBoardRedirect, TravelLiftRedirect } from "./screens/land-redirects";
import { LandModuleScreen } from "./screens/land-module-screen";
import { SettingsScreen } from "./screens/settings-screen";
import { YardCrewScreen } from "./screens/yard-tablet-screen";
import { DemoDeepLink } from "./components/demo/demo-deep-link";
import { StoryGuide } from "./components/demo/story-guide";
import { MarinaProvider } from "./store/marina-store";

function App() {
  return (
    <MarinaProvider>
      <BrowserRouter>
        <DemoDeepLink />
        <StoryGuide />
        <Routes>
          <Route path="/yard" element={<YardCrewScreen />} />
          <Route path="/portal/:token" element={<Navigate to="/operations/calendar" replace />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/operations/calendar" replace />} />
            <Route path="/calendar" element={<Navigate to="/operations/calendar" replace />} />
            <Route path="/launch-board" element={<Navigate to="/operations/launch-board" replace />} />
            <Route path="/tablet" element={<Navigate to="/yard" replace />} />
            <Route path="/settings" element={<Navigate to="/settings/general-info" replace />} />
            <Route path="/dashboard/actions" element={<ActionsScreen />} />
            <Route path="/operations/calendar" element={<CalendarScreen />} />
            <Route path="/operations/dry-stack" element={<LandModuleScreen module="dry_storage" />} />
            <Route path="/operations/boatyard" element={<LandModuleScreen module="boatyard" />} />
            <Route path="/operations/hardstand" element={<Navigate to="/operations/dry-stack" replace />} />
            <Route path="/operations/launch-board" element={<LaunchBoardRedirect />} />
            <Route path="/operations/tablet" element={<Navigate to="/yard" replace />} />
            <Route path="/operations/travel-lift" element={<TravelLiftRedirect />} />
            <Route path="/operations/fork-lift" element={<ForkLiftRedirect />} />
            <Route path="/settings/general-info" element={<SettingsScreen />} />
            <Route path="/settings/demo-routines" element={<DemoRoutinesScreen />} />
            <Route path="/invoices/:id" element={<DraftInvoiceScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MarinaProvider>
  );
}

export default App;
