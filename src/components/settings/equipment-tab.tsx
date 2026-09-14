import { usesForkLift, usesTravelLift } from "../../lib/modules";
import { useMarina } from "../../store/marina-store";
import type { Equipment } from "../../types/domain";

export function EquipmentTab() {
  const { state, upsertEquipment } = useMarina();
  const showTravel = usesTravelLift(state.settings);
  const showFork = usesForkLift(state.settings);
  const machines = state.equipment.filter((item) => {
    if (item.kind === "travel_lift") return showTravel;
    if (item.kind === "fork_lift") return showFork;
    return false;
  });

  function patch(item: Equipment, next: Partial<Equipment>) {
    upsertEquipment({ ...item, ...next });
  }

  return (
    <div className="space-y-4" data-settings-tab="equipment">
      <p className="text-sm text-muted-foreground">
        One vessel per time slot. Travel lift is for boatyard; fork lift is for dry stack and hardstand.
      </p>
      {machines.length === 0 ? (
        <p className="text-sm text-neutral-500">Turn on Boatyard, Dry stack, or Hardstand to configure equipment.</p>
      ) : null}
      {machines.map((item) => (
        <section key={item.id} className="space-y-3 rounded-md border border-border p-3" data-equipment-row={item.id}>
          <div className="flex items-center justify-between gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <input
                value={item.name}
                onChange={(event) => patch(item, { name: event.target.value })}
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-5 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) => patch(item, { active: event.target.checked })}
              />
              Active
            </label>
          </div>
          <p className="text-xs capitalize text-muted-foreground">{item.kind.replace("_", " ")}</p>
          <div className="grid grid-cols-3 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Opens</span>
              <input
                type="time"
                value={item.dayStart}
                onChange={(event) => patch(item, { dayStart: event.target.value })}
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Closes</span>
              <input
                type="time"
                value={item.dayEnd}
                onChange={(event) => patch(item, { dayEnd: event.target.value })}
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Slot (minutes)</span>
              <input
                type="number"
                min={15}
                step={15}
                value={item.slotMinutes}
                onChange={(event) => patch(item, { slotMinutes: Math.max(15, Number(event.target.value) || 15) })}
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>
      ))}
    </div>
  );
}
