import { PlusIcon, XIcon } from "lucide-react";
import { useMarina } from "../../store/marina-store";

export function ChecklistsTab() {
  const { state, updateSettings } = useMarina();
  const categories = state.settings.checklistCategories;

  function setCategories(next: string[]) {
    updateSettings({ checklistCategories: next });
  }

  function rename(index: number, value: string) {
    setCategories(categories.map((item, i) => (i === index ? value : item)));
  }

  function remove(index: number) {
    setCategories(categories.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-xl space-y-4" data-settings-tab="checklists">
      <p className="text-sm text-neutral-600">
        These options appear as the small label under each checklist row. On Job types and Launch / lift
        task types, pick one for every item. You can still change the label on a single job or launch.
      </p>
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Checklist options</span>
        {categories.length === 0 ? (
          <p className="text-xs text-neutral-500">No options yet — add labels such as Yard job, Launch, or QA photo.</p>
        ) : (
          <ul className="overflow-hidden rounded-xl bg-[#f2f2f7] divide-y divide-black/8">
            {categories.map((category, index) => (
              <li key={index} className="flex items-center gap-3 px-3 py-2.5">
                <input
                  value={category}
                  aria-label="Checklist option"
                  onChange={(event) => rename(index, event.target.value)}
                  className="h-5 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-800 outline-none"
                />
                <button
                  type="button"
                  aria-label="Remove option"
                  onClick={() => remove(index)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-neutral-300 hover:bg-black/5 hover:text-neutral-500"
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setCategories([...categories, ""])}
          className="inline-flex items-center gap-1.5 px-1 text-[13px] font-medium text-[hsl(252,75%,55%)] hover:text-[hsl(252,75%,45%)]"
        >
          <PlusIcon className="size-3.5" />
          Add option
        </button>
      </div>
    </div>
  );
}
