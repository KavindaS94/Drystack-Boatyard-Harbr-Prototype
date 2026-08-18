# Harbr yard prototype

Frontend-only prototype for **boatyard** and **dry storage**. It is **not** the live Harbr app.

All data in this app is **fake**. Nothing here writes to production, talks to the Harbr API, or changes marina records.

## How it works

New here? Read **[HOW-IT-WORKS.md](./HOW-IT-WORKS.md)** — a plain, step-by-step walkthrough of every screen.

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
2. **Berth → dockyard** — open A12 (Berth) → Send to Dockyard → pick a spot + Travel lift + **Keep berth** *or* **Move (free berth)** → Job + T&Cs Sent/Signed → lift done blocked until Signed.
3. **Afloat job** — open B3 (Berth) Corsair → Job with **Work location: Afloat** → log hours → Create draft (no lift needed).
4. **Busy Saturday** — Launch board, ~50 tasks → mark launch done → status stored → launched → set departed → mark lift done → stored.
5. **Settings** — rename Dockyard / Dry stack; add a job type colour; add a product with bank Holding.

A collapsible **Demo scripts** block on the Calendar lists the main ones too.

## Requirements

This prototype follows the plans in the live Harbr repo:

- [Boatyard requirements](../harbr-app/docs/plans/boatyard-requirements.md)
- [Dry storage (drystack) requirements](../harbr-app/docs/plans/drystack-requirements.md)
