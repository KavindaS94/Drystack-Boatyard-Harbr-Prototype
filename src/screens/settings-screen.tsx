import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BerthsTab } from "../components/settings/berths-tab";
import { ChecklistsTab } from "../components/settings/checklists-tab";
import { EquipmentTab } from "../components/settings/equipment-tab";
import { JobTypesTab } from "../components/settings/job-types-tab";
import { ProductsTab } from "../components/settings/products-tab";
import { TaskTypesTab } from "../components/settings/task-types-tab";
import { WordsTab } from "../components/settings/words-tab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { enabledLandModules, usesForkLift, usesTravelLift } from "../lib/modules";
import { useMarina } from "../store/marina-store";

type SettingsTabId = "words" | "berths" | "job-types" | "task-types" | "equipment" | "checklists" | "products";

interface TabDef {
  id: SettingsTabId;
  label: string;
  title: string;
  description: string;
}

const SETTINGS_TABS: SettingsTabId[] = [
  "words",
  "berths",
  "job-types",
  "task-types",
  "equipment",
  "checklists",
  "products",
];

function tabFromQuery(value: string | null): SettingsTabId {
  if (value && SETTINGS_TABS.includes(value as SettingsTabId)) return value as SettingsTabId;
  return "words";
}

export function SettingsScreen() {
  const { state } = useMarina();
  const [params] = useSearchParams();
  const { boatyardEnabled } = state.settings;
  const landOn = enabledLandModules(state.settings).length > 0;
  const equipmentOn = usesTravelLift(state.settings) || usesForkLift(state.settings);
  const [tab, setTab] = useState<SettingsTabId>(() => tabFromQuery(params.get("tab")));

  const tabs: TabDef[] = [
    {
      id: "words",
      label: "Modules & words",
      title: "Modules & words",
      description: "Turn Boatyard, Dry stack and Hardstand on or off, and set the words this marina uses on screen.",
    },
    {
      id: "berths",
      label: "Berths",
      title: "Berths",
      description: "Every space has a Kind — Berth, Boatyard, Dry stack or Hardstand — which drives its screens and rules.",
    },
    ...(boatyardEnabled
      ? [
          {
            id: "job-types" as const,
            label: "Job types",
            title: "Job types",
            description: "The marina's own yard jobs — each sets a colour, default duration, checklist and billable products.",
          },
        ]
      : []),
    ...(landOn
      ? [
          {
            id: "task-types" as const,
            label: "Task types",
            title: "Launch / lift task types",
            description: "Launch, lift, or other tasks per module, each with a checklist and the product billed when Office creates a draft.",
          },
        ]
      : []),
    ...(equipmentOn
      ? [
          {
            id: "equipment" as const,
            label: "Equipment",
            title: "Equipment",
            description: "Travel lift and fork lift hours, slot length, and whether each machine is in use.",
          },
        ]
      : []),
    {
      id: "checklists",
      label: "Checklists",
      title: "Checklists",
      description: "The option labels that sit under each checklist item. Job types and launch types pick one per row.",
    },
    {
      id: "products",
      label: "Products",
      title: "Products",
      description: "Every billable line is a product carrying its price and bank account — nothing is typed free-hand.",
    },
  ];

  const active = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 sm:p-6" data-settings-screen>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">General Info</p>
      </div>

      <div
        className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3 lg:grid-cols-7"
        role="tablist"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active.id === item.id}
            onClick={() => setTab(item.id)}
            data-settings-tab-button={item.id}
            className={
              active.id === item.id
                ? "rounded-md bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-neutral-900"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{active.title}</CardTitle>
          <CardDescription>{active.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {active.id === "words" ? <WordsTab /> : null}
          {active.id === "berths" ? <BerthsTab /> : null}
          {active.id === "job-types" ? <JobTypesTab /> : null}
          {active.id === "task-types" ? <TaskTypesTab /> : null}
          {active.id === "equipment" ? <EquipmentTab /> : null}
          {active.id === "checklists" ? <ChecklistsTab /> : null}
          {active.id === "products" ? <ProductsTab /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
