import { enabledSpaceKinds } from "../../lib/modules";
import { kindLabel } from "../../lib/labels";
import { cn } from "../../lib/utils";
import { useMarina } from "../../store/marina-store";
import type { SpaceKind } from "../../types/domain";

interface KindChip {
  id: string;
  label: string;
  kinds: SpaceKind[];
}

function sameKinds(left: SpaceKind[], right: SpaceKind[]): boolean {
  return left.length === right.length && left.every((kind) => right.includes(kind));
}

export function KindFilter() {
  const { state, setKindFilter } = useMarina();
  const { settings, kindFilter } = state;

  const enabledKinds = enabledSpaceKinds(settings);

  const chips: KindChip[] = [
    { id: "all", label: "All", kinds: enabledKinds },
    { id: "wet", label: "Berth", kinds: ["wet"] },
    ...enabledKinds
      .filter((kind) => kind !== "wet")
      .map((kind) => ({
        id: kind,
        label: kindLabel(kind, settings),
        kinds: [kind] as SpaceKind[],
      })),
  ];

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md border border-gray-200 bg-gray-50 p-0.5 shadow-sm">
      {chips.map((chip) => {
        const isActive = sameKinds(kindFilter, chip.kinds);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => setKindFilter(chip.kinds)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium",
              isActive ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
