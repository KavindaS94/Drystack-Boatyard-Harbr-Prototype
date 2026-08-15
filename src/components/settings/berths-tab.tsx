import { kindLabel } from "../../lib/labels";
import { useMarina } from "../../store/marina-store";
import type { SpaceKind } from "../../types/domain";

const KINDS: SpaceKind[] = ["wet", "boatyard", "dry_storage"];

export function BerthsTab() {
  const { state, updateBerthKind } = useMarina();

  return (
    <div className="overflow-x-auto" data-settings-tab="berths">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <th className="px-2 py-2 font-medium">Name</th>
            <th className="px-2 py-2 font-medium">Pier</th>
            <th className="px-2 py-2 font-medium">Kind</th>
            <th className="px-2 py-2 font-medium">Length</th>
            <th className="px-2 py-2 font-medium">Price class</th>
          </tr>
        </thead>
        <tbody>
          {state.berths.map((berth) => (
            <tr key={berth.id} className="border-b border-neutral-100" data-berth-row={berth.id}>
              <td className="px-2 py-2 font-medium text-neutral-900">{berth.name}</td>
              <td className="px-2 py-2 text-neutral-700">{berth.pier}</td>
              <td className="px-2 py-2">
                <select
                  value={berth.kind}
                  onChange={(event) => updateBerthKind(berth.id, event.target.value as SpaceKind)}
                  data-berth-kind={berth.id}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm"
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kindLabel(kind, state.settings)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-2 text-neutral-700">{berth.lengthM} m</td>
              <td className="px-2 py-2 text-neutral-700">{berth.priceClassName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
