import { NavLink } from "react-router-dom";
import { kindLabel } from "../lib/labels";
import { useMarina } from "../store/marina-store";

interface NavItem {
  to: string;
  label: string;
  detail?: string;
}

export function SidebarNav() {
  const { state } = useMarina();
  const { settings } = state;

  const items: NavItem[] = [
    { to: "/calendar", label: "Calendar" },
    ...(settings.dryStorageEnabled
      ? [{ to: "/launch-board", label: "Launch board", detail: kindLabel("dry_storage", settings) }]
      : []),
    { to: "/settings", label: "Settings" },
    { to: "/tablet", label: "Yard tablet", detail: kindLabel("boatyard", settings) },
  ];

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive
              ? "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
              : "rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          }
        >
          <span className="block">{item.label}</span>
          {item.detail ? (
            <span className="block text-xs font-normal opacity-70">{item.detail}</span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
