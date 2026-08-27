# Harbr yard prototype

Frontend-only prototype for **boatyard**, **dry stack**, and **customer communication**. It is **not** the live Harbr app.

All data in this app is **fake**. Nothing here writes to production, talks to the Harbr API, or changes marina records.

## How it works

New here? Read **[HOW-IT-WORKS.md](./HOW-IT-WORKS.md)** — short click-by-click demos of each flow.

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

Walk these from **Settings → Demo routines** (step-by-step in the app). All data is fake.

1. **Yard-only job** — open H4 Sea Sprite (antifoul) → Job → log hours/materials on tablet (no $) → Office creates draft → banner **This invoice → Holding**.
2. **Dockyard: berth → yard → berth** — A12 Mako → **Send to Dockyard** → empty pad + **Move (free berth)** → T&Cs signed → **Mark job done** → footer **Move** back to A12 → **Create draft invoice** (Holding).
3. **Afloat job** — open B3 (Berth) Corsair → Job with **Work location: Afloat** → log hours → Create draft (labour only, no dockyard fee). Banner **This invoice → Holding**.
4. **Dry stack: berth → rack → water** — Osprey on **A10** → **Send to Dry stack** DS5 (free berth) → **Add task** Launch → **Launch** tab Start → Done (**Launched**) → **Move** back to A10 → **Create draft invoice** (Launch, Marina).
5. **Busy Saturday** — Launch board this Saturday, ~50 tasks → Start → Done → status stored → launched → set departed → mark lift done → stored. Then Calendar → Pelican → **Create draft invoice** (Launch + Lift, banner **This invoice → Marina**). Monthly rack storage is not on that draft.
6. **Settings** — rename Dockyard / Dry stack; toggle auto do-not-launch; add a job type/product.
7. **Customer portal round trip** — open [/portal/demo-pelican-portal](http://localhost:5173/portal/demo-pelican-portal) as Priya (Pelican) → request a launch → staff Launch board (today) → Approve → Start → Done → portal shows **In the water**. Or from a reservation: **Send status link** → Open as customer.
8. **Do not launch** — [/portal/demo-tern-portal](http://localhost:5173/portal/demo-tern-portal) (Mark Chen overdue) or [/portal/demo-heron-portal](http://localhost:5173/portal/demo-heron-portal) (Sarah Quinn expired insurance) → submit a new insurance date → staff **Actions** Approve → block clears. Launch board Friday shows customer requests waiting.
9. **Approve owner changes** — Heron portal → Edit contact or insurance → Save (pending amber chip) → staff [/dashboard/actions](http://localhost:5173/dashboard/actions) → review the diff → Reject with a reason (owner resubmits) or **Approve** (values apply, insurance DNL clears). **Send status link** opens the related vessel or yard-job card.

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
