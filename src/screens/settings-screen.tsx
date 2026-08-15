import { useState } from "react";
import { BerthsTab } from "../components/settings/berths-tab";
import { JobTypesTab } from "../components/settings/job-types-tab";
import { ProductsTab } from "../components/settings/products-tab";
import { TaskTypesTab } from "../components/settings/task-types-tab";
import { WordsTab } from "../components/settings/words-tab";
import { useMarina } from "../store/marina-store";

type SettingsTabId = "words" | "berths" | "job-types" | "task-types" | "products";

interface TabDef {
  id: SettingsTabId;
  label: string;
}

export function SettingsScreen() {
  const { state } = useMarina();
  const { boatyardEnabled, dryStorageEnabled } = state.settings;
  const [tab, setTab] = useState<SettingsTabId>("words");

  const tabs: TabDef[] = [
    { id: "words", label: "Modules + words" },
    { id: "berths", label: "Berths" },
    ...(boatyardEnabled ? [{ id: "job-types" as const, label: "Job types" }] : []),
    ...(dryStorageEnabled ? [{ id: "task-types" as const, label: "Task types" }] : []),
    { id: "products", label: "Products" },
  ];

  const activeTab =
    (tab === "job-types" && !boatyardEnabled) || (tab === "task-types" && !dryStorageEnabled)
      ? "words"
      : tab;

  return (
    <div className="space-y-4" data-settings-screen>
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
      <nav className="-mb-px flex flex-wrap gap-1 border-b border-neutral-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            data-settings-tab-button={item.id}
            className={
              activeTab === item.id
                ? "-mb-px border-b-2 border-neutral-900 px-3 py-2 text-sm font-medium text-neutral-900"
                : "px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            }
          >
            {item.label}
          </button>
        ))}
      </nav>
      {activeTab === "words" ? <WordsTab /> : null}
      {activeTab === "berths" ? <BerthsTab /> : null}
      {activeTab === "job-types" ? <JobTypesTab /> : null}
      {activeTab === "task-types" ? <TaskTypesTab /> : null}
      {activeTab === "products" ? <ProductsTab /> : null}
    </div>
  );
}
