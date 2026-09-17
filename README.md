# Harbr yard prototype

Frontend-only prototype for **boatyard**, **dry stack**, and **email customer communication**. It is **not** the live Harbr app.

All data in this app is **fake**. Nothing here writes to production, talks to the Harbr API, or changes marina records.

## How it works

Walkthroughs live in **[WORKFLOW.md](./WORKFLOW.md)** — one file for the Elena antifoul story, extra scenes, and product rules.

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

Walk **Settings → Demo story** — *Elena wants antifoul*. **Reset and start story**, then click **Next**. Same steps are written in **[WORKFLOW.md](./WORKFLOW.md)**. Extra scenes are under **More scenes**. All data is fake.

## What this revamp demonstrates

- **Communication loop** between marina office, yard crew, and boat owner
- **Do-not-launch** auto-flags for overdue accounts and expired insurance (Scarborough)
- **Customer launch requests** (staff-logged, email status) including “Launching now” (Western Port / winter→summer)
- **Boatyard** work-by tags (marina / DIY / contractor), contractor notify, relaunch reschedule, QA photos (Fenwick’s / Scarborough)
- **Message trail** and activity log on every reservation

## Requirements

This prototype follows the plans in the live Harbr repo:

- [Boatyard requirements](../harbr-app/docs/plans/boatyard-requirements.md)
- [Dry storage (drystack) requirements](../harbr-app/docs/plans/drystack-requirements.md)
