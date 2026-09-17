import { useLayoutEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { SidebarProvider } from "../components/ui/sidebar";
import { HARBR_STORY_ID } from "../lib/demo-story";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";
import { AppHeader } from "./app-header";
import { GlobalSidebar } from "./global-sidebar";

function crumbsForPath(pathname: string): { pages: string[]; page: string } {
  if (pathname.startsWith("/dashboard/actions")) return { pages: ["Dashboard"], page: "Actions" };
  if (pathname.startsWith("/operations/dry-stack")) return { pages: ["Operations"], page: "Dry stack" };
  if (pathname.startsWith("/operations/boatyard")) return { pages: ["Operations"], page: "Boatyard" };
  if (pathname.startsWith("/settings/demo-routines")) return { pages: ["Settings"], page: "Demo story" };
  if (pathname.startsWith("/settings")) return { pages: ["Settings"], page: "General Info" };
  if (pathname.startsWith("/invoices")) return { pages: ["Accounting"], page: "Draft invoice" };
  return { pages: ["Operations"], page: "Calendar" };
}

export function AppShell() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { state, setRole } = useMarina();
  const storyOn = params.get("story") === HARBR_STORY_ID;
  const crumbs = crumbsForPath(location.pathname);
  const page =
    location.pathname.startsWith("/operations/dry-stack")
      ? state.settings.dryStorageLabel
      : location.pathname.startsWith("/operations/boatyard")
        ? state.settings.boatyardLabel
        : crumbs.page;
  const pages = crumbs.pages;
  const roleForPath = "office";

  useLayoutEffect(() => {
    if (state.role !== roleForPath) setRole(roleForPath);
  }, [roleForPath, setRole, state.role]);

  return (
    <SidebarProvider className={cn("h-svh overflow-hidden", storyOn && "pb-32")}>
      <GlobalSidebar>
        <AppHeader pages={pages} page={page} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  );
}
