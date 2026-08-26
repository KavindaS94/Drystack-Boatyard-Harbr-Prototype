# How to demo

Open [http://localhost:5173](http://localhost:5173). You land on the **Calendar**. The marina name in the sidebar and portal is **Harbr**.

All data is fake. If something already ran or a boat is missing: bottom-left **MS** button → **Reset demo** → confirm.

Skip grey menu items (**Home**, **Map**, **Owners**, …). They are not in this prototype. **Dashboard → Actions** is live — pending owner edits and bookings to approve.

On the Calendar, filter **Dry stack** or **Dockyard** to see only that module. Click a coloured bar to open the boat on the right.

**Settings → Demo routines** is the click-by-click walkthrough. Bottom-left **MS** still has **Reset demo**. Calendar, Actions, and invoices are always **Office**. **Yard tablet** is the crew view (no prices).

Use **two tabs** when the owner is involved — one for staff, one for the portal.

Invoice from the Calendar (Office). The **Yard tablet** hides prices and cannot open invoices.

---

# Dry stack

Racks on land. The boat **lives on the rack**. First it is lifted onto the rack. Then the owner asks for a launch when they want it in the water. At the end of the day it is lifted back.

Filter the Calendar to **Dry stack**. Left menu **Launch board** is the day list.

**Settings → Demo routines** jumps to Osprey (the arrival).

---

## 1. Boat comes onto the rack

The boat is in the water (or arriving). The yard lifts it onto the rack. Only then can anyone launch it.

1. **Settings → Demo routines → Boat onto the rack**, or Calendar → **Dry stack** → click **Osprey** on DS5.
2. Right panel status is **Launched** — she is still in the water, not on the rack yet.
3. Left menu **Launch board**. Date **14 Aug 2026**.
4. Find **08:00 Lift · Osprey**. It is already **Scheduled** (office booked it from a phone call).
5. Click **Start**, then **Done**. Badge: **Launched → Stored**. She is on the rack.
6. Calendar → click **Osprey**. Status is now **Stored**.
7. **Create draft invoice**. One **Lift** line ($85). Banner **This invoice → Marina**.

That Lift is the arrival charge. Monthly rack storage is on the booking, not this draft.

**Other way in** if the Lift is not on the board: Launch board → **Add task** → search **Osprey** → task type **Lift** → pick a time → **Save**. **Start** / **Done** only work while she is still in the water.

---

## 2. Owner requests a launch — live status

The boat is already on the rack. Phone request → marina says yes → yard puts the boat in → owner watches it happen.

**Tab 1 (staff):** stay on the Calendar.  
**Tab 2 (owner):** [Pelican portal](http://localhost:5173/portal/demo-pelican-portal)

Do not use the “Customer portal round trip” script in the staff tab — that would leave the staff screen.

1. Owner tab: you are Priya. Boat is **Pelican**, status **Stored** (already on the rack).
2. Under **Request a launch or lift**, leave **Launch** on, date **14 Aug 2026**, pick a time.
3. Click **Send request** — this is the owner asking the marina.
4. **Updates** at the bottom says the marina received it.
5. Staff tab: left menu **Launch board**. Date should be **14 Aug 2026**.
6. **Pelican** is in **Customer requests** at the top. (Ignore Tern / Heron — they are blocked; that is the next demo.)
7. Click **Approve** — the marina accepts. Pelican moves onto the timed list as **Scheduled**.
8. Click **Start** — the yard has begun. Owner tab status becomes **Launching now**.
9. Click **Done** — the boat is in. Owner tab status becomes **In the water**.
10. Calendar → click **Pelican** → **Create draft invoice**. One **Launch** line, banner **This invoice → Marina**.

**Other way in:** Calendar → click **Pelican** → **Send status link** → **Send link** → **Open as customer**. The link includes `?focus=` so the portal scrolls to and highlights **Pelican**.

---

## How invoicing should be done

Monthly rack storage stays on the booking. It is **not** on this draft.

Each **Lift** (onto the rack) and each **Launch** (into the water) is a movement charge. The yard marks the task **Done**. Office invoices later — do not auto-invoice on every **Done**, or a busy Saturday would create ~50 drafts.

1. Finish the work first (Osprey onto the rack, Pelican’s launch, or the Saturday run below).
2. Calendar → click the boat.
3. Under **Launch/lift tasks**, Done items that are not billed yet are ready.
4. Click **Create draft invoice**.
5. The draft opens. Lines are **Launch** and/or **Lift** ($85 each). Banner **This invoice → Marina**.
6. Those tasks now say **Invoiced**. Click the button again and there is nothing left.

If a task type has no product linked, Settings → **Launch / lift task types** → pick **Invoice product** → **Save**.

---

## 3. Do not launch — blocked boats stay on the rack

Overdue account or expired insurance: the owner cannot request, and the yard cannot **Start**. There is nothing to invoice until the boat actually moves.

### Overdue (Tern)

1. Open [Tern portal](http://localhost:5173/portal/demo-tern-portal) — Mark Chen / **Tern**.
2. Status is **Stored**. A red card says **Account overdue**. There is no **Send request**.
3. Calendar: **Tern** on DS2 has a red **Do not launch** label. Click it. The panel shows **Do not launch** and **Overdue**.
4. **Launch board** (14 Aug): Tern’s request has a **Do not launch** badge. You can still **Approve**, but **Start** and **Done** stay grey until the account is clear.

### Expired insurance (Heron) — owner can fix it (needs marina approval)

1. Open [Heron portal](http://localhost:5173/portal/demo-heron-portal) — Sarah Quinn / **Heron**.
2. Same red card, reason **Insurance expired**.
3. On the boat card, **Edit** insurance expiry, pick a future date (e.g. 1 Aug 2027), **Save**.
4. An amber chip says **Pending marina approval**. The DNL stays until staff approve.
5. Staff tab: left menu **Dashboard → Actions** (or **Settings → Demo routines → Approve owner changes**).
6. **Pending Changes** shows Sarah / Heron in the Harbr table (**Field | Current | Requested**).
7. **Reject** and type a reason (e.g. “Need a certificate photo”). Owner portal shows the reason.
8. Owner clicks **Edit and resubmit**, saves again.
9. Staff **Approve**. The new date applies, insurance DNL clears, and **Updates** says the changes were approved.
10. Red cards go away. **Send request** comes back. On the Launch board the **Do not launch** badge is gone.

### Manual hold (office only)

1. On the Calendar, click a clear dry-stack boat already on the rack (e.g. **Curlew**).
2. **Set manual DNL** — type a reason. Blocked on calendar, board, and portal.
3. **Clear override** — removes that hold. Overdue / insurance blocks still apply if they are on.

---

## 4. Busy Saturday — the run sheet

Replaces a printed Word list of ~50 launches and lifts. Invoice **after** the boat’s trips are Done, not after every tap.

1. **Settings → Demo routines → Busy Saturday**. Date becomes **15 Aug 2026**.
2. About **25 launches · 25 lifts**, grouped by time.
3. Use **Pelican** — she has both sides of the trip:
   - **09:00 Launch** → **Start** then **Done**. Badge: **Stored → Launched**.
   - **Departed** — the owner has left the marina.
   - **15:00 Lift** → **Start** then **Done**. Badge: back to **Stored**.
4. Click the left side of a row to open the **checklist** and tick items.
5. **Add task** (top right) — search a customer, pick Launch or Lift, pick a time, **Save**. Same as booking from a phone call.
6. Calendar → click **Pelican** → **Create draft invoice**. Two lines: **Launch** and **Lift**. Banner **This invoice → Marina**.

**Start** / **Done** stay grey on Tern (overdue) and Heron (insurance), unless you already cleared those.

If you already ran dry-stack flow 2, Pelican may already be in the water. **Reset demo** first.

---

# Boatyard

Pads on land for repair. Filter the Calendar to **Dockyard**. Left menu **Yard tablet** is the crew view (no prices). Office turns the same work into an invoice.

Occupied pads cannot be double-booked. **Send to Dockyard**, **Edit**, and **Move** all check the dockyard. If the pad is taken you get Harbr’s **Reservation Conflict** dialog.

---

## How invoicing should be done

Yard never sees dollar amounts. They log hours, parts, and photos on the job. Office turns that into a draft.

1. Stay on the Calendar (leave the tablet).
2. Open the job (Calendar bar, or **Yard tablet** then **← Today’s yard Jobs**).
3. Hours and materials should already be on the job. If not, **Add** them here — Yard cannot see `$`.
4. Click **Create draft invoice**.
5. The draft opens. Banner is the bank those products use:
   - Most yard products are **Holding** → **This invoice → Holding**.
   - Mix Marina and Holding products → **Mixed banks — review lines**.
6. What is on the draft:
   - Hours and materials logged on the job.
   - **Dockyard fee × nights on the pad** — only when the boat is in the dockyard, not afloat.
   - **Never** a **Berth night**. Water rent stays on the Marina berth, even if they **Keep berth**.
7. **Yard** cannot open this screen (“You cannot view invoices”).

---

## 1. Yard job — crew logs work, office invoices

1. **Settings → Demo routines → Yard job**, or click **H4 Sea Sprite** (amber bar) on the Calendar.
2. Right panel **Job** is open: checklist, hours, materials, lift / launch times.
3. Left menu **Yard tablet**. Prices disappear. Search **Sea Sprite** and tap it.
4. Tick the checklist. Next to Hours / Materials click **Add**. Tick the two photo boxes. Still no `$`.
5. **← Today’s yard Jobs**, then back to the Calendar (Office).
6. On Sea Sprite’s panel click **Create draft invoice**.
7. The draft opens. Labour / parts you added, plus **Dockyard fee** for the nights on H4. Banner **This invoice → Holding**.

---

## 2. Berth boat into the dockyard — owner must sign T&Cs

A water berth boat is lifted into the yard. The job cannot be marked done until T&Cs are signed.

Invoice this the same way as Sea Sprite **after** the yard has logged work. **Keep berth** vs **Move (free berth)** only changes the water berth — not what goes on the yard draft.

1. **Settings → Demo routines → Berth boat into the dockyard**, or click **A12 Mako**.
2. Click **Send to Dockyard**.
3. The default pad is an empty one. Job type **Travel lift**, lift **09:00**.
4. Occupied pads in the list say **unavailable** (H4 has Sea Sprite, H1 has Kingfisher, H3 has Riviera).
5. **Keep berth** = they still pay for the water. **Move (free berth)** = give A12 up.
6. To see the conflict dialog: pick **H4** → **Confirm**. **Reservation Conflict** shows berth **H4** and the dates already booked (**10 Aug 2026** – **14 Aug 2026**). **Cancel** stays in this form. **View Calendar** closes it.
7. Pick an empty pad (H2 or H5) → **Confirm**. Mako now has a dockyard bar. The right panel is the yard job.
8. T&Cs say **Not sent**. Click **Send T&Cs**. **Mark job done** stays disabled.
9. **Send status link** → **Send link** → **Open as customer**. The portal opens on the **Yard job** card (purple ring).
10. On the portal, type the owner’s name → **Sign T&Cs**.
11. Back on staff, T&Cs are **Signed**. **Mark job done** works.
12. **Add** hours if needed, then **Create draft invoice**. Dockyard fee is included. Berth night is not.

Shortcut if you skip the portal: **Mark signed** on the job.

---

## 3. Move a boat — dockyard availability

Same **Reservation Conflict** dialog as live Harbr. **Move** can send a boat onto a berth, a dockyard pad, or a dry-stack rack. Occupied spaces are labelled **unavailable**.

1. **Settings → Demo routines → Yard job**, or click **H4 Sea Sprite**.
2. Footer **Move**.
3. **Move to** lists every space, including dockyard pads.
4. Pick **H1 · Dockyard** (Kingfisher is already there) → **Move**.
5. **Reservation Conflict** — berth **H1**, **12 Aug 2026** – **13 Aug 2026**.
6. **Cancel** — change the pad. **View Calendar** — close and look at the grid.
7. Pick a free pad (H2 or H5) → **Move**. Sea Sprite’s bar moves.

**Edit** (same-type berth only) uses the same check. If the dates overlap another booking, you get the same dialog.

---

## 4. Afloat job — work in the water, no lift

Not a dockyard pad — engine work at the berth. Invoice labour and parts only. No dockyard nights.

1. **Settings → Demo routines → Afloat job**, or click **B3 Corsair**.
2. **Job** is already there. **Work location: Afloat**.
3. **Add** hours, then **Create draft invoice**. Banner **This invoice → Holding**. No **Dockyard fee**.

On a berth with no job yet, **Add afloat job** starts the same thing.

---

## 5. Contractor, move relaunch, photos

1. Calendar: click **H1 Kingfisher** (bar says **Contractor**).
2. **Who does the work** = **Contractor**, name **Marine Works**.
3. **Notify** — simulated email to the contractor (shows under **Messages**).
4. Change to **DIY** or **Marina** — the calendar bar tag updates.
5. **Move relaunch** — pick a later date. The booking extends if needed; the owner gets an SMS.
6. **Yard tablet** → **Kingfisher**. Tick the two photo boxes. **Mark job done** waits until T&Cs are signed (**Mark signed**, or the portal).
7. Back **Office**, **Create draft invoice** the same way as any other yard job.

---

# Both modules

These sit on every boat, dry stack or boatyard.

---

## Owner edits — approve or reject

Contact details and insurance do not apply instantly. The owner submits a change; staff review the diff on **Actions**.

1. Owner tab: [Heron portal](http://localhost:5173/portal/demo-heron-portal). **Your account** is the Harbr portal look (purple header, white cards).
2. **Contact details → Edit** a phone number → **Save**. Amber: **Waiting for the marina to approve**.
3. Staff: **Dashboard → Actions** → **Pending Changes**. Same table chrome as live Harbr. Diff: Field / Current / Requested.
4. **Approve** applies the values and messages the owner. **Reject** needs a reason; the owner sees it and **Edit and resubmit**.
5. Insurance works the same way. Approving a future insurance date clears the insurance DNL.
6. The reservation panel shows **Pending changes (n) — Review in Actions** while a request is waiting.

Sign T&Cs, **I've departed**, and launch/lift requests stay instant (launch/lift still go through the Launch board).

---

## Approve a booking

1. **Settings → Demo routines → Approve a booking**, or **Dashboard → Actions → Pending Approvals**, or click **A14 Shearwater** (**To be approved**).
2. **Review Agreement** — read the fake berth agreement (**Harbr — berth agreement**).
3. **Approve reservation** — header becomes **Approved**.
4. After that you get **View Agreement**, **Edit**, **Move**, **Archive**.
5. **Edit** = dates and same-type berth. **Move** = any space, including dockyard (see boatyard flow 3). Both show **Reservation Conflict** if the space is taken.
6. **Book another** is not in this prototype. **Archive** is blocked while a yard job is still open.

---

## Message the owner

1. Calendar: click any boat (Pelican for dry stack, Sea Sprite for boatyard).
2. **Send status link** → pick SMS or Email → **Send link**. Then **Copy link** or **Open as customer**.
3. Expand **Messages** → **Send message**. Pick a template → **Send**.
4. The same line shows on the panel and in the portal **Updates** list.
5. **Activity** is the staff log. **Reservation related notes** — type, **Save**.

---

## Settings

Left menu **Settings → General Info**, or **Demo routines → Settings**.

| Tab | Try this |
|-----|----------|
| **Modules & words** | Turn **Boatyard** or **Dry stack** off — that module disappears. Rename the labels. Turn off auto-block for overdue / insurance — Tern / Heron unblock. Turn off **Allow customers to request launches** — portal form hides. |
| **Berths** | Change a space’s kind (Berth / Dockyard / Dry stack). |
| **Job types** | Boatyard colours, checklists, QA photos, T&Cs. Add/remove items, then **Save**. New jobs copy the lists; you can still change them on the job. |
| **Launch / lift task types** | Dry stack names, checklists, and **Invoice product** (Launch / Lift). That product is what **Create draft invoice** puts on the dry-stack draft. Checklists on a launch row can be edited too. |
| **Products** | Name, price, bank (**Marina** or **Holding**). That bank is the invoice banner. Launch and Lift are Marina. Dockyard fee, labour, and parts are Holding. |

---

## Portal links (they do not expire)

Dry stack:

- [Pelican](http://localhost:5173/portal/demo-pelican-portal) — Priya. Happy-path launch.
- [Tern](http://localhost:5173/portal/demo-tern-portal) — Mark. Account overdue; cannot launch.
- [Heron](http://localhost:5173/portal/demo-heron-portal) — Sarah. Expired insurance; **Save** a future date, then staff **Actions → Approve** to clear.

Boatyard: from a yard job, **Send status link** → **Open as customer** (sign T&Cs). The portal header says **Harbr**.

A bad or expired link shows “This link has expired — ask the marina for a new one.”
