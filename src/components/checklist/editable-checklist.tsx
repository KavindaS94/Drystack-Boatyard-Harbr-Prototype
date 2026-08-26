import { PlusIcon, XIcon } from "lucide-react";

export interface CheckItem {
  id?: string;
  label: string;
  done: boolean;
}

interface EditableChecklistProps {
  items: CheckItem[];
  onChange: (items: CheckItem[]) => void;
  disabled?: boolean;
  showChecks?: boolean;
  addLabel?: string;
  emptyHint?: string;
  prefix?: string;
}

export function EditableChecklist({
  items,
  onChange,
  disabled = false,
  showChecks = true,
  addLabel = "Add item",
  emptyHint,
  prefix,
}: EditableChecklistProps) {
  function update(index: number, patch: Partial<CheckItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, { label: "", done: false }]);
  }

  return (
    <div className="space-y-1.5" data-editable-checklist>
      {items.length === 0 && emptyHint ? <p className="text-xs text-neutral-500">{emptyHint}</p> : null}
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {showChecks ? (
              <input
                type="checkbox"
                checked={item.done}
                disabled={disabled}
                onChange={() => update(index, { done: !item.done })}
                className="size-4 shrink-0"
                aria-label={item.label || "Checklist item"}
              />
            ) : null}
            {prefix ? <span className="shrink-0 text-sm">{prefix}</span> : null}
            <input
              value={item.label}
              disabled={disabled}
              placeholder="Checklist item"
              onChange={(event) => update(index, { label: event.target.value })}
              className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-800 disabled:bg-neutral-50"
            />
            {disabled ? null : (
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => remove(index)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {disabled ? null : (
        <button
          type="button"
          onClick={add}
          data-checklist-add
          className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(252,75%,55%)] hover:text-[hsl(252,75%,45%)]"
        >
          <PlusIcon className="size-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

interface TemplateChecklistProps {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
  emptyHint?: string;
}

export function TemplateChecklist({
  items,
  onChange,
  addLabel = "Add item",
  emptyHint = "No items yet — add the steps this marina uses.",
}: TemplateChecklistProps) {
  return (
    <EditableChecklist
      items={items.map((label) => ({ label, done: false }))}
      showChecks={false}
      addLabel={addLabel}
      emptyHint={items.length === 0 ? emptyHint : undefined}
      onChange={(next) => onChange(next.map((item) => item.label))}
    />
  );
}
