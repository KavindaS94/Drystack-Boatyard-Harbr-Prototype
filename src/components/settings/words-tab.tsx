import { useMarina } from "../../store/marina-store";

export function WordsTab() {
  const { state, updateSettings } = useMarina();
  const { settings } = state;

  return (
    <div className="max-w-xl space-y-6" data-settings-tab="words">
      <section className="space-y-3 rounded-md border border-border p-3">
        <h2 className="text-sm font-semibold text-neutral-900">Modules</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.boatyardEnabled}
            onChange={(event) => updateSettings({ boatyardEnabled: event.target.checked })}
            data-boatyard-enabled
          />
          Boatyard
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.dryStorageEnabled}
            onChange={(event) => updateSettings({ dryStorageEnabled: event.target.checked })}
            data-dry-storage-enabled
          />
          Dry stack
        </label>
      </section>

      <section className="space-y-3 rounded-md border border-border p-3">
        <h2 className="text-sm font-semibold text-neutral-900">Words</h2>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Boatyard label</span>
          <input
            value={settings.boatyardLabel}
            onChange={(event) => updateSettings({ boatyardLabel: event.target.value })}
            data-boatyard-label
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Dry stack label</span>
          <input
            value={settings.dryStorageLabel}
            onChange={(event) => updateSettings({ dryStorageLabel: event.target.value })}
            data-dry-storage-label
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-md border border-border p-3">
        <h2 className="text-sm font-semibold text-neutral-900">Yard tablet</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.hidePricesForYard}
            onChange={(event) => updateSettings({ hidePricesForYard: event.target.checked })}
            data-hide-prices-for-yard
          />
          Hide prices for yard
        </label>
      </section>

      <section className="space-y-3 rounded-md border border-border p-3">
        <h2 className="text-sm font-semibold text-neutral-900">Do not launch</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.autoDnlOverdue}
            onChange={(event) => updateSettings({ autoDnlOverdue: event.target.checked })}
            data-auto-dnl-overdue
          />
          Auto-block when account is overdue
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.autoDnlInsurance}
            onChange={(event) => updateSettings({ autoDnlInsurance: event.target.checked })}
            data-auto-dnl-insurance
          />
          Auto-block when insurance is expired
        </label>
      </section>

      <section className="space-y-3 rounded-md border border-border p-3">
        <h2 className="text-sm font-semibold text-neutral-900">Customer portal</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={settings.allowPortalRequests}
            onChange={(event) => updateSettings({ allowPortalRequests: event.target.checked })}
            data-allow-portal-requests
          />
          Allow customers to request launches
        </label>
      </section>
    </div>
  );
}
