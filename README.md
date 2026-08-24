# Harbr yard prototype

Frontend-only prototype for **boatyard**, **dry stack**, and **customer communication**. It is **not** the live Harbr app.

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

Walk these scripts. All data is fake. Use **Demo scripts** in the bottom-left user menu, or open the URLs directly.

1. **Yard-only job** — open H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner **This invoice → Holding**.
2. **Berth → dockyard** — open A12 (Berth) → Send to Dockyard → pick a spot + Travel lift + **Keep berth** *or* **Move (free berth)** → Job + T&Cs Sent/Signed → lift done blocked until Signed.
3. **Afloat job** — open B3 (Berth) Corsair → Job with **Work location: Afloat** → log hours → Create draft (no lift needed).
4. **Busy Saturday** — Launch board date 15 Aug, ~50 tasks → Start → Done → status stored → launched → set departed → mark lift done → stored.
5. **Settings** — rename Dockyard / Dry stack; toggle auto do-not-launch; add a job type/product.
6. **Customer portal round trip** — open [/portal/demo-pelican-portal](http://localhost:5173/portal/demo-pelican-portal) as Priya (Pelican) → request a launch → staff Launch board (14 Aug) → Approve → Start → Done → portal shows **In the water**. Or from a reservation: **Send status link** → Open as customer.
7. **Do not launch** — [/portal/demo-tern-portal](http://localhost:5173/portal/demo-tern-portal) (Mark Chen overdue) or [/portal/demo-heron-portal](http://localhost:5173/portal/demo-heron-portal) (Sarah Quinn expired insurance) → update insurance on portal → block clears. Launch board Friday shows customer requests waiting.

## What this revamp demonstrates

- **Communication loop** between marina office, yard crew, and boat owner
- **Do-not-launch** auto-flags for overdue accounts and expired insurance (Scarborough)
- **Customer launch requests** with live status including “Launching now” (Western Port / winter→summer)
- **Boatyard** work-by tags (marina / DIY / contractor), contractor notify, relaunch reschedule, QA photos (Fenwick’s / Scarborough)
- **Message trail** and activity log on every reservation

## Requirements

This prototype follows the plans in the live Harbr repo:

- [Boatyard requirements](../harbr-app/docs/plans/boatyard-requirements.md)
- [Dry storage (drystack) requirements](../harbr-app/docs/plans/drystack-requirements.md)
