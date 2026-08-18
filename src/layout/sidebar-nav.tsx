import {
  BookOpenIcon,
  ChevronRightIcon,
  Settings2Icon,
  ShipIcon,
  TabletSmartphoneIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { kindLabel } from "../lib/labels";
import { useMarina } from "../store/marina-store";

interface SubItem {
  to: string;
  label: string;
  detail?: string;
}

interface NavGroup {
  title: string;
  icon: LucideIcon;
  /** When present the row is a collapsible section; otherwise a direct link. */
  items?: SubItem[];
  to?: string;
}

/** Mirrors the real Harbr GlobalSidebar: icon rows, collapsible sections, an indented sub-item rail. */
export function SidebarNav() {
  const { state } = useMarina();
  const { settings } = state;

  const groups: NavGroup[] = [
    {
      title: "Operations",
      icon: ShipIcon,
      items: [
        { to: "/calendar", label: "Calendar" },
        ...(settings.dryStorageEnabled
          ? [{ to: "/launch-board", label: "Launch board", detail: kindLabel("dry_storage", settings) }]
          : []),
      ],
    },
    {
      title: "Yard tablet",
      icon: TabletSmartphoneIcon,
      to: "/tablet",
    },
    {
      title: "Settings",
      icon: Settings2Icon,
      to: "/settings",
    },
  ];

  return (
    <nav className="flex flex-col gap-1 px-2 py-2">
      {groups.map((group) =>
        group.items ? (
          <CollapsibleGroup key={group.title} group={group} />
        ) : (
          <NavLink
            key={group.title}
            to={group.to ?? "#"}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent font-medium text-primary"
                  : "font-medium text-neutral-700 hover:bg-sidebar-accent/60 hover:text-neutral-900"
              }`
            }
          >
            <group.icon className="size-4 shrink-0" />
            <span>{group.title}</span>
          </NavLink>
        )
      )}

      <div className="mt-2 border-t border-sidebar-border pt-2">
        <a
          href="https://www.harbrapp.com/blogs/how-to"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-neutral-600 hover:bg-sidebar-accent/60 hover:text-neutral-900"
        >
          <BookOpenIcon className="size-4 shrink-0" />
          <span>How-to Guides</span>
        </a>
      </div>
    </nav>
  );
}

function CollapsibleGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(true);
  const Icon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-sidebar-accent/60 hover:text-neutral-900"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{group.title}</span>
        <ChevronRightIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <ul className="mx-4 flex flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5">
          {group.items?.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent font-medium text-primary"
                      : "text-neutral-600 hover:bg-sidebar-accent/60 hover:text-neutral-900"
                  }`
                }
              >
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.detail ? (
                  <span className="shrink-0 rounded border border-[hsl(252,75%,80%)] bg-[hsl(252,75%,99%)] px-1.5 text-[10px] font-medium text-[hsl(252,75%,55%)]">
                    {item.detail}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
