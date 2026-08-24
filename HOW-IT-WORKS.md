# How the Yard + Dry stack prototype works

A plain, step-by-step walkthrough of everything in the prototype.

---

## When you open it

1. You land on the **Calendar**.
2. On the **left** is the menu: Calendar, Launch board, Yard tablet, Settings.
3. **Top left** shows the marina name ("Harbour Demo").
4. **Bottom left** is your user button — click it to switch between **Office** (sees prices) and **Yard** (prices hidden), or pick a **Demo script**.

---

## The Calendar (the main screen)

5. It's a grid: **boats' spaces down the side**, **days across the top**.
6. Spaces come in 3 types, shown by the filter buttons at the top right: **Berth** (boat in the water), **Dockyard** (boat lifted out for work), **Dry stack** (boat stored on a rack).
7. Click a filter to show only that type, or **All**.
8. Each coloured bar is a booking. A maintenance job's bar takes the **colour of its job type**, and may show **DIY / Contractor**, lift time, or a 🚫 when do-not-launch applies.
9. **Click any bar** → a panel opens on the right with that boat's details.

---

## The right-side panel (when you click a boat)

10. Top shows the **boat name** and a tag saying its reservation status.
11. Below that: the **dates, customer, boat size, berth, insurance expiry**.
12. **Do not launch** (red pill) appears when the account is overdue, insurance is expired, or staff set a manual hold.
13. **Send status link** at the bottom opens a dialog — simulated SMS/email with Copy link and **Open as customer** (the portal).
14. **Messages** and **Activity** sections keep a trail of everything sent and who did what.
15. What appears next depends on the type of space:

### If it's a Berth (in the water)

16. If there's no work yet, you see two buttons: **Add afloat job** and **Send to Dockyard**.
17. **Add afloat job** = do work while the boat stays in the water. A job section appears with a checklist, hours, and materials.
18. **Send to Dockyard** = lift the boat out for work.

### If it's a Dockyard (lifted out)

19. You see the full **Job**: job type, who does the work (Marina / DIY / Contractor), lift/launch times, checklist, hours, materials.
20. **Notify** emails the contractor (simulated) and logs it on the message trail.
21. **Move relaunch** shifts the relaunch date and extends the reservation if needed ("Boatyard Jenga").
22. If the job needs signed **T&Cs**, send them to the customer portal — or mark signed manually. You can't mark the job done until they're signed.
23. **Create draft invoice** turns hours/materials into a bill (Office role only).

### If it's a Dry stack (stored boat)

24. You see its **status** (Stored / Launched / Departed), DNL state, and upcoming launch/lift tasks.
25. Office can set or clear a **manual DNL override** with a logged reason.

---

## Sending a boat to the dockyard (the pop-up)

26. Pick the **yard spot**, the **dates**, the **job type**, and a **lift time**.
27. Choose **Keep berth** (still pay for the water spot) or **Move (free berth)** (give it up).
28. If the boat is too long for the spot, it warns you.
29. Click **Confirm** — the boat now shows on the dockyard with its job.

---

## The Yard tablet (for the yard crew)

30. Open **Yard tablet** from the menu — it looks like a phone/tablet screen.
31. **Search** for a boat, tap it, and you get the **checklist, hours, materials, and QA photos** (lift-out / relaunch).
32. The crew sees **no prices** here — just the work. Contractor name shows when assigned.

---

## The Launch board (for stored boats)

33. Open **Launch board** from the menu. It defaults to a busy **Friday** with customer requests.
34. Pick a **day** — Saturday 15 Aug still has ~50 seeded tasks.
35. **Customer requests** sit at the top — Approve or Decline (decline asks a reason; both notify the customer).
36. Day totals show launches / lifts / requests. The run sheet is **grouped by time**.
37. Each row shows customer, boat, storage status, task progress (**Scheduled / In progress / Done**), and DNL if blocked.
38. Press **Start** when you begin putting the boat in — the customer portal shows **Launching now**. Press **Done** when finished — status moves Stored → Launched (or back to Stored after a lift).
39. DNL boats cannot be started or marked done until the block clears.
40. **Add task** lets reception book a new launch by searching for the customer.

---

## The Customer portal (boat owner phone view)

41. Open a link like `/portal/demo-pelican-portal` (no login, no sidebar).
42. See each boat's **live status**: Stored, **Launching now**, In the water, or Departed.
43. **Request a launch or lift** with date and time — if DNL applies, the request form is replaced by a block card with the reason.
44. **Update insurance expiry** — a future date clears an insurance DNL automatically.
45. For yard jobs with T&Cs sent: **type your name and Sign**.
46. **Updates** feed shows every SMS/email the marina "sent".
47. Expired links show a friendly "ask the marina for a new one" page.

Demo portal tokens that never expire in the seed:

- `/portal/demo-pelican-portal` — Priya Shah / Pelican (happy path)
- `/portal/demo-tern-portal` — Mark Chen / Tern (**account overdue** → DNL)
- `/portal/demo-heron-portal` — Sarah Quinn / Heron (**insurance expired** → DNL)

---

## Settings (set up the marina)

48. Open **Settings** → tabs across the top.
49. **Modules & words** — turn Boatyard / Dry stack on or off, rename them, toggle auto-DNL (overdue / insurance), allow portal launch requests, hide prices for yard.
50. **Berths** — set each space's type (Berth / Dockyard / Dry stack).
51. **Job types** — your list of yard jobs, each with a colour, checklist, and products.
52. **Task types** — your launch/lift tasks.
53. **Products** — every billable item, its price, and which **bank account** it goes to.

---

## The two roles (bottom-left user button)

54. **Office** = sees prices, invoices, bank accounts, and can set DNL overrides.
55. **Yard** = same work, but **prices are hidden** — for crew who shouldn't see money.

---

That's the whole app: **Calendar** to see everything, **panel** to work on one boat (and talk to the owner), **tablet** for the yard crew, **Launch board** for dry stack high-turnover days, **Customer portal** for status and requests, and **Settings** to configure it — all looking and behaving like the real Harbr.
