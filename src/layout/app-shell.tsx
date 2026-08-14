import { Outlet } from "react-router-dom";
import { RoleSwitcher } from "./role-switcher";
import { SidebarNav } from "./sidebar-nav";

export function AppShell() {
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
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
