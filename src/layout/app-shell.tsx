import { BellIcon, ChevronRightIcon, ChevronsUpDownIcon, PanelLeftIcon } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

const DEMO_SCRIPTS = [
  {
    title: "Yard-only job",
    steps:
      "open H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner This invoice → Holding.",
  },
  {
    title: "Wet → yard",
    steps:
      "open A12 (wet) → Send to hardstand → pick H2 + Travel lift + Keep berth or Move (free wet) → Job + T&Cs Sent/Signed → lift done blocked until Signed.",
  },
  {
    title: "Busy Saturday",
    steps:
      "Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark retrieve done → stored.",
  },
  {
    title: "Settings",
    steps: "rename Hardstand / Dry stack; add a job type colour; add a product with bank Holding.",
  },
] as const;

/** Breadcrumb trail per route — mirrors Harbr's section / page header. */
function crumbsForPath(pathname: string): [string, string] {
  if (pathname.startsWith("/launch-board")) return ["Operations", "Launch board"];
  if (pathname.startsWith("/tablet")) return ["Field", "Yard tablet"];
  if (pathname.startsWith("/settings")) return ["Settings", "General Info"];
  if (pathname.startsWith("/invoices")) return ["Accounting", "Draft invoice"];
  return ["Operations", "Calendar"];
}

function DemoScripts() {
  return (
    <details className="group max-w-3xl" data-demo-scripts>
      <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900">
        Demo scripts
      </summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-muted-foreground">
        {DEMO_SCRIPTS.map((script) => (
          <li key={script.title}>
            <span className="font-semibold text-neutral-800">{script.title}</span>
            {" — "}
            {script.steps}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function AppShell() {
  const location = useLocation();
  const showDemoScripts = location.pathname === "/calendar";
  const [section, page] = crumbsForPath(location.pathname);

  return (
    <div className="flex min-h-screen bg-neutral-50">
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
        {showDemoScripts ? (
          <div className="border-b border-border bg-white px-6 py-2">
            <DemoScripts />
          </div>
        ) : null}
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
