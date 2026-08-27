import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChecklistItem, ChecklistOption } from "../../types/domain";

export type CheckItem = ChecklistItem & { id?: string };

interface EditableChecklistProps {
  items: CheckItem[];
  onChange: (items: CheckItem[]) => void;
  disabled?: boolean;
  showChecks?: boolean;
  addLabel?: string;
  emptyHint?: string;
  categories: string[];
  fallbackCategory: string;
}

export function EditableChecklist({
  items,
  onChange,
  disabled = false,
  showChecks = true,
  addLabel = "Add item",
  emptyHint,
  categories,
  fallbackCategory,
}: EditableChecklistProps) {
  const categoryOptions = uniqueCategories(categories, items, fallbackCategory);

  function update(index: number, patch: Partial<CheckItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, { label: "", category: fallbackCategory, done: false }]);
  }

  return (
    <div className="space-y-2" data-editable-checklist>
      {items.length === 0 && emptyHint ? <p className="text-xs text-neutral-500">{emptyHint}</p> : null}
      {items.length > 0 ? (
        <ul className="overflow-hidden rounded-xl bg-[#f2f2f7] divide-y divide-black/8">
          {items.map((item, index) => (
            <li key={item.id ?? index} className="flex items-center gap-3 px-3 py-2.5">
              {showChecks ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.done}
                  aria-label={item.label || "Checklist item"}
                  disabled={disabled}
                  onClick={() => update(index, { done: !item.done })}
                  className={cn(
                    "flex size-5.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors disabled:opacity-50",
                    item.done
                      ? "border-[#34c759] bg-[#34c759] text-white"
                      : "border-neutral-400 bg-transparent"
                  )}
                >
                  {item.done ? <CheckIcon className="size-3 stroke-3" /> : null}
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <input
                  value={item.label}
                  disabled={disabled}
                  placeholder="Checklist item"
                  onChange={(event) => update(index, { label: event.target.value })}
                  className={cn(
                    "h-5 w-full bg-transparent text-[15px] leading-5 text-neutral-800 outline-none placeholder:text-neutral-400 disabled:opacity-70",
                    item.done && showChecks && "text-neutral-400 line-through"
                  )}
                />
                <select
                  value={item.category || fallbackCategory}
                  disabled={disabled}
                  aria-label="Checklist category"
                  onChange={(event) => update(index, { category: event.target.value })}
                  className={cn(
                    "mt-0.5 h-5 max-w-full bg-transparent text-[13px] leading-4 text-neutral-400 outline-none disabled:opacity-70",
                    item.done && showChecks && "opacity-70"
                  )}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {disabled ? null : (
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => remove(index)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-neutral-300 hover:bg-black/5 hover:text-neutral-500"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {disabled ? null : (
        <button
          type="button"
          onClick={add}
          data-checklist-add
          className="inline-flex items-center gap-1.5 px-1 text-[13px] font-medium text-[hsl(252,75%,55%)] hover:text-[hsl(252,75%,45%)]"
        >
          <PlusIcon className="size-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

interface TemplateChecklistProps {
  items: ChecklistOption[];
  onChange: (items: ChecklistOption[]) => void;
  addLabel?: string;
  emptyHint?: string;
  categories: string[];
  fallbackCategory: string;
}

export function TemplateChecklist({
  items,
  onChange,
  addLabel = "Add item",
  emptyHint = "No items yet — add the steps this marina uses.",
  categories,
  fallbackCategory,
}: TemplateChecklistProps) {
  return (
    <EditableChecklist
      items={items.map((item) => ({ ...item, done: false }))}
      showChecks={false}
      addLabel={addLabel}
      categories={categories}
      fallbackCategory={fallbackCategory}
      emptyHint={items.length === 0 ? emptyHint : undefined}
      onChange={(next) => onChange(next.map((item) => ({ label: item.label, category: item.category })))}
    />
  );
}

function uniqueCategories(settings: string[], items: CheckItem[], fallback: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of [...settings, fallback, ...items.map((item) => item.category)]) {
    const category = value.trim();
    if (!category || seen.has(category)) continue;
    seen.add(category);
    result.push(category);
  }
  return result;
}
