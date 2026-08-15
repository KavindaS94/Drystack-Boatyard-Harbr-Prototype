import { Outlet, useLocation } from "react-router-dom";
import { RoleSwitcher } from "./role-switcher";
import { SidebarNav } from "./sidebar-nav";

const DEMO_SCRIPTS = [
  {
    title: "Yard-only job",
    steps:
      "open H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner This invoice → Holding.",
  },
  {
    title: "Wet → yard",
    steps:
      "open A12 (wet) → Send to hardstand → pick H2 + Travel lift + Keep wet berth or Move (free wet) → Job + T&Cs Sent/Signed → lift done blocked until Signed.",
  },
  {
    title: "Busy Saturday",
    steps:
      "Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark retrieve done → stored.",
  },
  {
    title: "Settings",
    steps: "rename Hardstand / Dry storage; add a job type colour; add a product with bank Holding.",
  },
] as const;

function DemoScripts() {
  return (
    <details className="group max-w-3xl" data-demo-scripts>
      <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900">
        Demo scripts
      </summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-neutral-600">
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

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="px-5 py-5">
          <p className="text-xl font-semibold tracking-tight text-neutral-900">Harbr</p>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <p className="text-sm font-medium text-neutral-900">Harbour Demo</p>
          <RoleSwitcher />
        </header>
        {showDemoScripts ? (
          <div className="border-b border-neutral-200 bg-white px-6 py-2">
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
