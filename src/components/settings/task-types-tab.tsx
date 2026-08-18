import { useState } from "react";
import { useMarina } from "../../store/marina-store";
import type { TaskType } from "../../types/domain";

const KINDS: TaskType["kind"][] = ["launch", "retrieval", "other"];

const EMPTY = {
  name: "",
  kind: "launch" as TaskType["kind"],
  checklistText: "",
};

function linesFromText(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function TaskTypesTab() {
  const { state, upsertTaskType } = useMarina();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function loadType(taskType: TaskType) {
    setEditingId(taskType.id);
    setForm({
      name: taskType.name,
      kind: taskType.kind,
      checklistText: taskType.checklist.join("\n"),
    });
  }

  function onSave() {
    if (!form.name.trim()) return;
    const existing = state.taskTypes.find((item) => item.id === editingId);
    upsertTaskType({
      id: editingId ?? `tt-${crypto.randomUUID()}`,
      name: form.name.trim(),
      kind: form.kind,
      checklist: linesFromText(form.checklistText),
      productId: existing?.productId,
      active: existing?.active ?? true,
    });
    resetForm();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]" data-settings-tab="task-types">
      <ul className="space-y-2">
        {state.taskTypes.map((taskType) => (
          <li key={taskType.id}>
            <button
              type="button"
              onClick={() => loadType(taskType)}
              data-task-type-row={taskType.id}
              className={`flex w-full flex-col items-start rounded-md border px-3 py-2 text-left ${
                editingId === taskType.id
                  ? "border-primary bg-neutral-50"
                  : "border-border hover:bg-neutral-50"
              }`}
            >
              <span className="text-sm font-medium text-neutral-900">{taskType.name}</span>
              <span className="text-xs capitalize text-muted-foreground">{taskType.kind}</span>
            </button>
          </li>
        ))}
      </ul>

      <form
        className="space-y-3 rounded-md border border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <h2 className="text-sm font-semibold text-neutral-900">
          {editingId ? "Edit task type" : "Add task type"}
        </h2>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            data-task-type-name
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Kind</span>
          <select
            value={form.kind}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, kind: event.target.value as TaskType["kind"] }))
            }
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind === "other" ? "Other" : kind === "launch" ? "Launch" : "Lift"}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Checklist (one line each)</span>
          <textarea
            rows={3}
            value={form.checklistText}
            onChange={(event) => setForm((prev) => ({ ...prev, checklistText: event.target.value }))}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-neutral-800"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            data-task-type-save
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {editingId ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
