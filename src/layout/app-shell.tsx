import { Outlet, useLocation } from "react-router-dom";
import { DemoDeepLink } from "../components/demo/demo-deep-link";
import { SidebarProvider } from "../components/ui/sidebar";
import { AppHeader } from "./app-header";
import { GlobalSidebar } from "./global-sidebar";

function crumbsForPath(pathname: string): { pages: string[]; page: string } {
  if (pathname.startsWith("/operations/launch-board")) return { pages: ["Operations"], page: "Launch board" };
  if (pathname.startsWith("/operations/tablet")) return { pages: ["Operations"], page: "Yard tablet" };
  if (pathname.startsWith("/settings")) return { pages: ["Settings"], page: "General Info" };
  if (pathname.startsWith("/invoices")) return { pages: ["Accounting"], page: "Draft invoice" };
  return { pages: ["Operations"], page: "Calendar" };
}

export function AppShell() {
  const location = useLocation();
  const { pages, page } = crumbsForPath(location.pathname);

  return (
    <SidebarProvider>
      <DemoDeepLink />
      <GlobalSidebar>
        <AppHeader pages={pages} page={page} />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <Outlet />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  );
}
