import { useMarina } from "../store/marina-store";
import type { Role } from "../types/domain";

const ROLES: { value: Role; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "yard", label: "Yard" },
];

export function RoleSwitcher() {
  const { state, setRole } = useMarina();

  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-100 p-0.5">
      {ROLES.map((role) => {
        const isActive = state.role === role.value;
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => setRole(role.value)}
            className={
              isActive
                ? "rounded px-3 py-1 text-sm font-medium bg-white text-neutral-900 shadow-sm"
                : "rounded px-3 py-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            }
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
