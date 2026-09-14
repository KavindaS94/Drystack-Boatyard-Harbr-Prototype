import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMarina } from "../store/marina-store";

export function UserMenu() {
  const navigate = useNavigate();
  const { state, resetDemo } = useMarina();
  const [open, setOpen] = useState(false);
  const viewLabel = state.role === "yard" ? "Yard view" : "Office view";

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
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-y-auto rounded-lg border border-sidebar-border bg-white p-1 shadow-lg">
          <Link
            to="/settings/demo-routines"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-1.5 hover:bg-sidebar-accent/60"
          >
            <span className="block text-sm font-medium text-[hsl(252,75%,45%)]">Demo story</span>
            <span className="block text-[11px] leading-4 text-muted-foreground">
              Elena wants antifoul — follow that one job
            </span>
          </Link>
          {state.settings.boatyardEnabled ? (
            <Link
              to="/yard"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-md px-2 py-1.5 hover:bg-sidebar-accent/60"
            >
              <span className="block text-sm font-medium text-neutral-800">Open yard crew</span>
              <span className="block text-[11px] leading-4 text-muted-foreground">
                Separate crew page — no office sidebar
              </span>
            </Link>
          ) : null}
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
          <span className="block truncate text-[11px] text-muted-foreground">{viewLabel}</span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}
