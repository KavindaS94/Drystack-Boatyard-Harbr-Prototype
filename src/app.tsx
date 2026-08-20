import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/app-shell";
import { CalendarScreen } from "./screens/calendar-screen";
import { DraftInvoiceScreen } from "./screens/draft-invoice-screen";
import { LaunchBoardScreen } from "./screens/launch-board-screen";
import { SettingsScreen } from "./screens/settings-screen";
import { YardTabletScreen } from "./screens/yard-tablet-screen";
import { MarinaProvider } from "./store/marina-store";

function App() {
  return (
    <MarinaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/operations/calendar" replace />} />
            <Route path="/calendar" element={<Navigate to="/operations/calendar" replace />} />
            <Route path="/launch-board" element={<Navigate to="/operations/launch-board" replace />} />
            <Route path="/tablet" element={<Navigate to="/operations/tablet" replace />} />
            <Route path="/settings" element={<Navigate to="/settings/general-info" replace />} />
            <Route path="/operations/calendar" element={<CalendarScreen />} />
            <Route path="/operations/launch-board" element={<LaunchBoardScreen />} />
            <Route path="/operations/tablet" element={<YardTabletScreen />} />
            <Route path="/settings/general-info" element={<SettingsScreen />} />
            <Route path="/invoices/:id" element={<DraftInvoiceScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MarinaProvider>
  );
}

export default App;
