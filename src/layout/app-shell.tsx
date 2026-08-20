import { BellIcon, ChevronRightIcon, ChevronsUpDownIcon, PanelLeftIcon } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DemoDeepLink } from "../components/demo/demo-deep-link";
import { createSeedState } from "../data/seed";
import { DEMO_SCRIPTS, resolveDemoReservationId } from "../lib/demo-scripts";
import { useMarina } from "../store/marina-store";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

/** Breadcrumb trail per route — mirrors Harbr's section / page header. */
function crumbsForPath(pathname: string): [string, string] {
  if (pathname.startsWith("/launch-board")) return ["Operations", "Launch board"];
  if (pathname.startsWith("/tablet")) return ["Field", "Yard tablet"];
  if (pathname.startsWith("/settings")) return ["Settings", "General Info"];
  if (pathname.startsWith("/invoices")) return ["Accounting", "Draft invoice"];
  return ["Operations", "Calendar"];
}

function DemoScripts() {
  const navigate = useNavigate();
  const { state, resetDemo, setSelectedDate, setSelectedReservationId } = useMarina();

  function onReset() {
    if (!window.confirm("Reset the demo to the starting data? Your click-through progress will be cleared.")) {
      return;
    }
    resetDemo();
    navigate("/calendar");
    toast.success("Demo reset to starting data");
  }

  function onScriptClick(scriptId: string) {
    if (scriptId === "saturday") {
      setSelectedDate(createSeedState().selectedDate);
      return;
    }
    const reservationId = resolveDemoReservationId(state, { script: scriptId, boat: null });
    if (reservationId) setSelectedReservationId(reservationId);
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <details className="group min-w-0 max-w-3xl flex-1" data-demo-scripts>
        <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900">
          Demo scripts
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Refresh keeps progress. Click a script to jump to that boat. Reset to start over.
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-muted-foreground">
          {DEMO_SCRIPTS.map((script) => (
            <li key={script.id}>
              <Link
                to={script.to}
                onClick={() => onScriptClick(script.id)}
                className="font-semibold text-primary hover:underline"
              >
                {script.title}
              </Link>
              {" — "}
              {script.steps}
            </li>
          ))}
        </ol>
      </details>
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Reset demo
      </button>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const [section, page] = crumbsForPath(location.pathname);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DemoDeepLink />
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Org switcher — mirrors Harbr's OrganizationSwitcher */}
        <div className="p-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                Harbour Demo
              </span>
              <span className="block truncate text-xs text-muted-foreground">Marina</span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* User menu — mirrors Harbr's UserButton (now also holds the Office/Yard role) */}
        <div className="border-t border-sidebar-border p-2">
          <UserMenu />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4">
          <PanelLeftIcon className="size-4 text-muted-foreground" />
          <span className="mx-1 h-5 w-px bg-border" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{section}</span>
            <ChevronRightIcon className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-neutral-900">{page}</span>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-neutral-100 hover:text-neutral-900"
            >
              <BellIcon className="size-4" />
            </button>
          </div>
        </header>
        <div className="border-b border-border bg-white px-6 py-2">
          <DemoScripts />
        </div>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
