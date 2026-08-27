import { useState } from "react";
import { TemplateChecklist } from "../checklist/editable-checklist";
import { trimChecklistOptions } from "../../lib/checklist";
import { useMarina } from "../../store/marina-store";
import type { ChecklistOption, JobType } from "../../types/domain";

const EMPTY = {
  name: "",
  colour: "#22c55e",
  defaultDurationDays: 1,
  checklist: [] as ChecklistOption[],
  photoChecklist: [] as ChecklistOption[],
  requiresTc: false,
  productIds: [] as string[],
};

export function JobTypesTab() {
  const { state, upsertJobType } = useMarina();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function loadType(jobType: JobType) {
    setEditingId(jobType.id);
    setForm({
      name: jobType.name,
      colour: jobType.colour,
      defaultDurationDays: jobType.defaultDurationDays,
      checklist: jobType.checklist.map((item) => ({ ...item })),
      photoChecklist: (jobType.photoChecklist ?? []).map((item) => ({ ...item })),
      requiresTc: jobType.requiresTc,
      productIds: jobType.productIds,
    });
  }

  function onSave() {
    if (!form.name.trim()) return;
    const existing = state.jobTypes.find((item) => item.id === editingId);
    upsertJobType({
      id: editingId ?? `jt-${crypto.randomUUID()}`,
      name: form.name.trim(),
      colour: form.colour,
      defaultDurationDays: Math.max(1, form.defaultDurationDays),
      checklist: trimChecklistOptions(form.checklist),
      photoChecklist: trimChecklistOptions(form.photoChecklist),
      productIds: form.productIds,
      requiresTc: form.requiresTc,
      active: existing?.active ?? true,
    });
    resetForm();
  }

  function toggleProduct(productId: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]" data-settings-tab="job-types">
      <ul className="space-y-2">
        {state.jobTypes.map((jobType) => (
          <li key={jobType.id}>
            <button
              type="button"
              onClick={() => loadType(jobType)}
              data-job-type-row={jobType.id}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left ${
                editingId === jobType.id
                  ? "border-primary bg-neutral-50"
                  : "border-border hover:bg-neutral-50"
              }`}
            >
              <span className="h-4 w-4 shrink-0 rounded-sm" style={{ backgroundColor: jobType.colour }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-neutral-900">{jobType.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {jobType.defaultDurationDays} day{jobType.defaultDurationDays === 1 ? "" : "s"}
                  {jobType.requiresTc ? " · Requires T&Cs" : ""}
                  {` · ${jobType.checklist.length} checks`}
                </span>
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
          {editingId ? "Edit job type" : "Add job type"}
        </h2>
        <p className="text-xs text-muted-foreground">
          New jobs copy these lists. Pick a checklist option for each row — edit the options in the Checklists tab.
        </p>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            data-job-type-name
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Colour</span>
            <input
              type="color"
              value={form.colour}
              onChange={(event) => setForm((prev) => ({ ...prev, colour: event.target.value }))}
              data-job-type-colour
              className="h-9 w-full rounded-md border border-border bg-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Duration (days)</span>
            <input
              type="number"
              min={1}
              value={form.defaultDurationDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, defaultDurationDays: Number(event.target.value) || 1 }))
              }
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Checklist</span>
          <TemplateChecklist
            items={form.checklist}
            onChange={(checklist) => setForm((prev) => ({ ...prev, checklist }))}
            addLabel="Add checklist item"
            categories={state.settings.checklistCategories}
            fallbackCategory="Yard job"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">QA photos</span>
          <TemplateChecklist
            items={form.photoChecklist}
            onChange={(photoChecklist) => setForm((prev) => ({ ...prev, photoChecklist }))}
            addLabel="Add photo item"
            categories={state.settings.checklistCategories}
            fallbackCategory="QA photo"
            emptyHint="No photo prompts — add any this marina wants ticked on the job."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={form.requiresTc}
            onChange={(event) => setForm((prev) => ({ ...prev, requiresTc: event.target.checked }))}
          />
          Requires T&Cs
        </label>
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-muted-foreground">Products</legend>
          {state.products.map((product) => (
            <label key={product.id} className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={form.productIds.includes(product.id)}
                onChange={() => toggleProduct(product.id)}
              />
              {product.name}
            </label>
          ))}
        </fieldset>
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
            data-job-type-save
            className="flex-1 rounded-md bg-[hsl(252,75%,70%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(252,75%,60%)]"
          >
            {editingId ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
