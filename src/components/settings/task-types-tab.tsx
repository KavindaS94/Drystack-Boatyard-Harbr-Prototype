import { useState } from "react";
import { TemplateChecklist } from "../checklist/editable-checklist";
import { trimChecklistOptions } from "../../lib/checklist";
import { enabledLandModules, moduleLabel } from "../../lib/modules";
import { useMarina } from "../../store/marina-store";
import type { ChecklistOption, TaskModule, TaskType } from "../../types/domain";

const KINDS: TaskType["kind"][] = ["launch", "retrieval", "other"];

const EMPTY = {
  name: "",
  kind: "launch" as TaskType["kind"],
  module: "dry_storage" as TaskModule,
  checklist: [] as ChecklistOption[],
  productId: "",
};

export function TaskTypesTab() {
  const { state, upsertTaskType } = useMarina();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const modules: TaskModule[] = [...enabledLandModules(state.settings), "other"];
  const visibleTypes = state.taskTypes.filter(
    (item) => item.module === "other" || modules.includes(item.module)
  );

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY, module: modules[0] ?? "other" });
  }

  function loadType(taskType: TaskType) {
    setEditingId(taskType.id);
    setForm({
      name: taskType.name,
      kind: taskType.kind,
      module: taskType.module,
      checklist: taskType.checklist.map((item) => ({ ...item })),
      productId: taskType.productId ?? "",
    });
  }

  function onSave() {
    if (!form.name.trim()) return;
    const existing = state.taskTypes.find((item) => item.id === editingId);
    upsertTaskType({
      id: editingId ?? `tt-${crypto.randomUUID()}`,
      name: form.name.trim(),
      kind: form.kind,
      module: form.kind === "other" ? "other" : form.module,
      checklist: trimChecklistOptions(form.checklist),
      productId: form.productId || undefined,
      active: existing?.active ?? true,
    });
    resetForm();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]" data-settings-tab="task-types">
      <ul className="space-y-2">
        {visibleTypes.map((taskType) => (
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
              <span className="text-xs capitalize text-muted-foreground">
                {moduleLabel(taskType.module, state.settings)} · {taskType.kind === "retrieval" ? "Lift" : taskType.kind}
                {(() => {
                  const product = state.products.find((item) => item.id === taskType.productId);
                  return product ? ` · ${product.name}` : " · no product";
                })()}
              </span>
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
        <p className="text-xs text-muted-foreground">
          New launch/lift tasks copy this list. You can still add or change items on a single task.
        </p>
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
        {form.kind !== "other" ? (
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Module</span>
            <select
              value={form.module}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, module: event.target.value as TaskModule }))
              }
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
            >
              {modules
                .filter((item) => item !== "other")
                .map((module) => (
                  <option key={module} value={module}>
                    {moduleLabel(module, state.settings)}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Invoice product</span>
          <select
            value={form.productId}
            onChange={(event) => setForm((prev) => ({ ...prev, productId: event.target.value }))}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="">None — not billed</option>
            {state.products
              .filter((product) => product.active)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.bankAccount})
                </option>
              ))}
          </select>
        </label>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Checklist</span>
          <TemplateChecklist
            items={form.checklist}
            onChange={(checklist) => setForm((prev) => ({ ...prev, checklist }))}
            addLabel="Add checklist item"
            categories={state.settings.checklistCategories}
            fallbackCategory={form.kind === "retrieval" ? "Lift" : "Launch"}
          />
        </div>
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
            className="flex-1 rounded-md bg-[hsl(252,75%,70%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(252,75%,60%)]"
          >
            {editingId ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
