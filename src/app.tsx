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
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/launch-board" element={<LaunchBoardScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/tablet" element={<YardTabletScreen />} />
            <Route path="/invoices/:id" element={<DraftInvoiceScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MarinaProvider>
  );
}

export default App;
