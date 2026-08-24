import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DEMO_FRIDAY, DEMO_SATURDAY } from "../lib/demo-dates";
import { DEMO_SCRIPTS, resolveDemoReservationId } from "../lib/demo-scripts";
import { useMarina } from "../store/marina-store";
import type { Role } from "../types/domain";

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "office", label: "Office", hint: "Sees prices, invoices and bank accounts" },
  { value: "yard", label: "Yard", hint: "Prices hidden on the tablet and job" },
];

export function UserMenu() {
  const navigate = useNavigate();
  const { state, setRole, resetDemo, setSelectedDate, setSelectedReservationId } = useMarina();
  const [open, setOpen] = useState(false);
  const current = ROLES.find((role) => role.value === state.role) ?? ROLES[0];

  function onReset() {
    if (
      !window.confirm("Reset the demo to the starting data? Your click-through progress will be cleared.")
    ) {
      return;
    }
    resetDemo();
    setOpen(false);
    navigate("/operations/calendar");
    toast.success("Demo reset to starting data");
  }

  function onScriptClick(scriptId: string) {
    if (scriptId === "saturday") {
      setSelectedDate(DEMO_SATURDAY);
      return;
    }
    if (scriptId === "dnl") {
      setSelectedDate(DEMO_FRIDAY);
      return;
    }
    if (scriptId === "portal") {
      return;
    }
    const reservationId = resolveDemoReservationId(state, { script: scriptId, boat: null });
    if (reservationId) setSelectedReservationId(reservationId);
  }

  return (
    <div className="relative w-full">
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
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-[min(28rem,70vh)] overflow-y-auto rounded-lg border border-sidebar-border bg-white p-1 shadow-lg">
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
                  className={`mt-0.5 size-4 shrink-0 ${active ? "text-[hsl(252,75%,55%)]" : "text-transparent"}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-medium ${active ? "text-[hsl(252,75%,45%)]" : "text-neutral-900"}`}
                  >
                    {role.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{role.hint}</span>
                </span>
              </button>
            );
          })}

          <div className="my-1 border-t border-sidebar-border" />
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Demo scripts
          </p>
          {DEMO_SCRIPTS.map((script) => (
            <Link
              key={script.id}
              to={script.to}
              onClick={() => {
                onScriptClick(script.id);
                setOpen(false);
              }}
              className="block rounded-md px-2 py-1.5 hover:bg-sidebar-accent/60"
            >
              <span className="block text-sm font-medium text-[hsl(252,75%,45%)]">{script.title}</span>
              <span className="block text-[11px] leading-4 text-muted-foreground">{script.steps}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-neutral-700 hover:bg-sidebar-accent/60"
          >
            Reset demo
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(252,75%,95%)] text-xs font-semibold text-[hsl(252,75%,45%)]">
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
