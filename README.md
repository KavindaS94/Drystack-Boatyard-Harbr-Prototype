# Harbr yard prototype

Frontend-only prototype for **boatyard** and **dry storage**. It is **not** the live Harbr app.

All data in this app is **fake**. Nothing here writes to production, talks to the Harbr API, or changes marina records.

## How to run

From this directory (`harbr-yard-prototype`, sibling of `harbr-app`):

```bash
pnpm install
pnpm dev
```

The app serves at [http://localhost:5173](http://localhost:5173).

```bash
pnpm build    # production build
pnpm preview  # preview the production build
```

Requires Node 22+ (or Node 20.12+). `pnpm` is the package manager.

## Stakeholder click-through

Walk these four scripts. All data is fake.

1. **Yard-only job** — open H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner **This invoice → Holding**.
2. **Wet → yard** — open A12 (wet) → Send to hardstand → pick H2 + Travel lift + **Keep wet berth** *or* **Move (free wet)** → Job + T&Cs Sent/Signed → lift done blocked until Signed.
3. **Busy Saturday** — Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark retrieve done → stored.
4. **Settings** — rename Hardstand / Dry storage; add a job type colour; add a product with bank Holding.

The same four scripts are in a collapsible **Demo scripts** block on Calendar.

## Requirements

This prototype follows the plans in the live Harbr repo:

- [Boatyard requirements](../harbr-app/docs/plans/boatyard-requirements.md)
- [Dry storage (drystack) requirements](../harbr-app/docs/plans/drystack-requirements.md)
