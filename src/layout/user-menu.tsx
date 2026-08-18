import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { useMarina } from "../store/marina-store";
import type { Role } from "../types/domain";

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "office", label: "Office", hint: "Sees prices, invoices and bank accounts" },
  { value: "yard", label: "Yard", hint: "Prices hidden on the tablet and job" },
];

/**
 * Sidebar-footer identity + role switcher — mirrors Harbr's UserButton menu.
 * Replaces the old top-bar Office/Yard toggle: role now lives with the user, where
 * a marina's price-visibility permission actually belongs.
 */
export function UserMenu() {
  const { state, setRole } = useMarina();
  const [open, setOpen] = useState(false);
  const current = ROLES.find((role) => role.value === state.role) ?? ROLES[0];

  return (
    <div className="relative">
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}

      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 rounded-lg border border-border bg-white p-1 shadow-lg">
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Viewing as
          </p>
          {ROLES.map((role) => {
            const active = role.value === state.role;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  setRole(role.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <CheckIcon
                  className={`mt-0.5 size-4 shrink-0 ${active ? "text-primary" : "text-transparent"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${active ? "text-primary" : "text-neutral-900"}`}>
                    {role.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{role.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-sidebar-accent"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-semibold text-primary">
          MS
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-neutral-900">Marina staff</span>
          <span className="block truncate text-[11px] text-muted-foreground">{current.label} view</span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}
