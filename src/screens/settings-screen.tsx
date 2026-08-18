import { useState } from "react";
import { BerthsTab } from "../components/settings/berths-tab";
import { JobTypesTab } from "../components/settings/job-types-tab";
import { ProductsTab } from "../components/settings/products-tab";
import { TaskTypesTab } from "../components/settings/task-types-tab";
import { WordsTab } from "../components/settings/words-tab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useMarina } from "../store/marina-store";

type SettingsTabId = "words" | "berths" | "job-types" | "task-types" | "products";

interface TabDef {
  id: SettingsTabId;
  label: string;
  title: string;
  description: string;
}

export function SettingsScreen() {
  const { state } = useMarina();
  const { boatyardEnabled, dryStorageEnabled } = state.settings;
  const [tab, setTab] = useState<SettingsTabId>("words");

  const tabs: TabDef[] = [
    {
      id: "words",
      label: "Modules & words",
      title: "Modules & words",
      description: "Turn Boatyard and Dry stack on or off, and set the words this marina uses on screen.",
    },
    {
      id: "berths",
      label: "Berths",
      title: "Berths",
      description: "Every space has a Kind — Berth, Boatyard or Dry stack — which drives its screens and rules.",
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
    ...(dryStorageEnabled
      ? [
          {
            id: "task-types" as const,
            label: "Task types",
            title: "Launch / lift task types",
            description: "The tasks the ground crew logs — launch, lift, or the marina's own, each with a checklist.",
          },
        ]
      : []),
    {
      id: "products",
      label: "Products",
      title: "Products",
      description: "Every billable line is a product carrying its price and bank account — nothing is typed free-hand.",
    },
  ];

  const active = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <div className="space-y-4" data-settings-screen>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">General Info</p>
      </div>

      {/* Full-width grid tabs — mirrors Harbr General Info TabsList */}
      <div
        className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3 lg:grid-cols-5"
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
                ? "rounded-md bg-white px-3 py-1.5 text-sm font-medium text-primary shadow-sm"
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
          {active.id === "products" ? <ProductsTab /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
