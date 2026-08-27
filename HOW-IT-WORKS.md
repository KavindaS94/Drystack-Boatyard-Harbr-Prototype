# How to demo

Open [http://localhost:5173](http://localhost:5173). You land on the **Calendar**. The marina name in the sidebar and portal is **Harbr**.

All data is fake. If something already ran or a boat is missing: bottom-left **MS** button → **Reset demo** → confirm.

Skip grey menu items (**Home**, **Map**, **Owners**, …). They are not in this prototype. **Dashboard → Actions** is live — pending owner edits and bookings to approve.

On the Calendar, filter **Dry stack** or **Dockyard** to see only that module. Click a coloured bar to open the boat on the right. Click an **empty** day on a rack, pad, or berth to add a booking.

**Settings → Demo routines** is the click-by-click walkthrough. Bottom-left **MS** still has **Reset demo**. Calendar, Actions, and invoices are always **Office**. **Yard tablet** is the crew view (no prices).

Use **two tabs** when the owner is involved — one for staff, one for the portal.

Invoice from the Calendar (Office). The **Yard tablet** hides prices and cannot open invoices.

---

# Dry stack

Racks on land. Full cycle: **water berth → lift onto the rack → launch back into the water**.

Filter the Calendar to **Dry stack**. Left menu **Launch board** is the day list — **Requests**, **Launch**, and **Lift** tabs.

**Settings → Demo routines → Dry stack: berth → rack → water** jumps to Osprey.

---

## 1. Berth → rack → water (Osprey)

One boat, the whole cycle. **Reset demo** first if she is already on a rack.

1. **Settings → Demo routines → Dry stack: berth → rack → water**, or Calendar → **Berth** → click **A10 Osprey**.
2. Right panel is a normal water berth — **Send to Dry stack**.
3. Pick empty **DS5**. Choose **Move (free berth)** so A10 is given up. **Confirm**. She is **Stored** on DS5. A10 is empty.
4. Launch board → **Add task** → search **Osprey** → task type **Launch** → pick a time (e.g. **14:00**) → **Save**.
5. Open the **Launch** tab: that Launch. **Start**, then **Done**. Badge: **Stored → Launched**.
6. Calendar: Osprey is on **In the water**. **DS5** is empty.
7. Footer **Move** → **A10 · Berth** → **Move**. She is back on a normal berth.
8. Calendar → Osprey → **Create draft invoice**. **Launch** ($85). Banner **This invoice → Marina**.

Monthly rack storage stays on the booking, not this draft.

---

## 2. Owner requests a launch — live status

The boat is already on the rack. Phone request → marina says yes → yard puts the boat in → owner watches it happen.

**Tab 1 (staff):** stay on the Calendar.  
**Tab 2 (owner):** [Pelican portal](http://localhost:5173/portal/demo-pelican-portal)

Do not use the “Customer portal round trip” script in the staff tab — that would leave the staff screen.

1. Owner tab: you are Priya. Boat is **Pelican**, status **Stored** (already on the rack).
2. Under **Request a launch or lift**, leave **Launch** on, date **today**, pick a time.
3. Click **Send request** — this is the owner asking the marina.
4. **Updates** at the bottom says the marina received it.
5. Staff tab: left menu **Launch board**. Date should be **today**.
6. Open the **Requests** tab. **Pelican** is waiting. (Ignore Tern / Heron — they are blocked; that is the next demo.)
7. Click **Approve** — the marina accepts. Pelican moves onto the **Launch** tab as **Scheduled**.
8. Click **Start** — the yard has begun. Owner tab status becomes **Launching now**.
9. Click **Done** — the boat is in. Owner tab status becomes **In the water**.
10. Calendar → click **Pelican** → **Create draft invoice**. One **Launch** line, banner **This invoice → Marina**.

**Other way in:** Calendar → click **Pelican** → **Send status link** → **Send link** → **Open as customer**. The link includes `?focus=` so the portal scrolls to and highlights **Pelican**.

---

## How invoicing should be done

Monthly rack storage stays on the booking. It is **not** on this draft.

Each **Lift** (onto the rack) and each **Launch** (into the water) is a movement charge. The yard marks the task **Done**. Office invoices later — do not auto-invoice on every **Done**, or a busy Saturday would create ~50 drafts.

1. Finish the work first (Osprey berth → rack → water, Pelican’s owner launch, or the Saturday run below).
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
4. **Launch board** (today): Tern’s request has a **Do not launch** badge. You can still **Approve**, but **Start** and **Done** stay grey until the account is clear.

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

1. **Settings → Demo routines → Busy Saturday**. Date becomes **this Saturday**.
2. About **25 launches · 25 lifts**, on the **Launch** and **Lift** tabs (still ordered by time in each).
3. Use **Pelican** — she has both sides of the trip (already on the rack):
   - **Launch** tab: **09:00 Launch** → **Start** then **Done**. Badge: **Stored → Launched**.
   - **Departed** — the owner has left the marina.
   - **Lift** tab: **15:00 Lift** → **Start** then **Done**. Badge: back to **Stored**.
4. Click the left side of a row to open the **checklist** and tick items.
5. **Add task** (top right) — search a customer, pick Launch or Lift, pick a time, **Save**. Same as booking from a phone call.
6. Calendar → click **Pelican** → **Create draft invoice**. Two lines: **Launch** and **Lift**. Banner **This invoice → Marina**.

**Start** / **Done** stay grey on Tern (overdue) and Heron (insurance), unless you already cleared those.

If you already ran dry-stack flow 2, Pelican may already be in the water. **Reset demo** first.

---

# Boatyard

Pads on land for repair. Full cycle: **water berth → lift into the dockyard → finish the job → move back onto a berth**.

Filter the Calendar to **Dockyard**. Left menu **Yard tablet** is the crew view (no prices). Office turns the same work into an invoice.

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
   - **Dockyard fee × nights on the pad** (minimum 1 day) — when the job is a dockyard lift, not afloat.
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

## 2. Berth → yard → berth — owner must sign T&Cs

A water berth boat is lifted into the yard, the job is finished, then she goes back on the water. The job cannot be marked done until T&Cs are signed.

**Keep berth** vs **Move (free berth)** only changes the water berth — not what goes on the yard draft. A same-day Travel lift still bills **1 × Dockyard fee** even if you skip hours.

**Reset demo** first if A12 is already empty.

1. **Settings → Demo routines → Dockyard: berth → yard → berth**, or click **A12 Mako**.
2. Click **Send to Dockyard**.
3. Pick an empty pad (**H5**). Job type **Travel lift**, lift **09:00**.
4. Occupied pads say **unavailable** (H4 Sea Sprite, H1 Kingfisher, H2 Riviera).
5. Choose **Move (free berth)** so A12 is given up — you will put her back at the end. **Keep berth** = they still pay for A12 while she is in the yard (skip the Move-back step).
6. To see the conflict dialog: pick **H4** → **Confirm**. **Reservation Conflict** shows berth **H4** and the dates already booked. **Cancel** stays in this form.
7. **Confirm**. Mako’s bar is on the dockyard pad. **A12 is empty**.
8. T&Cs say **Not sent**. Click **Send T&Cs**. **Mark job done** stays disabled.
9. **Send status link** → **Send link** → **Open as customer**, type the owner’s name → **Sign T&Cs**. Shortcut: **Mark signed** on the job.
10. Optional: **Yard tablet** → search **Mako** → tick checklist / photos, **Add** hours. No `$`.
11. Back on the Calendar: **Mark job done**.
12. Footer **Move** → **A12 · Berth** → **Move**. Mako is back on the water. The dockyard pad is free.
13. **Create draft invoice**. Dockyard fee is included. Berth night is not. Banner **This invoice → Holding**.

---

## 3. Move a boat — dockyard availability

Same **Reservation Conflict** dialog as live Harbr. **Move** can send a boat onto a berth, a dockyard pad, or a dry-stack rack. Occupied spaces are labelled **unavailable**.

1. **Settings → Demo routines → Yard job**, or click **H4 Sea Sprite**.
2. Footer **Move**.
3. **Move to** lists every space, including dockyard pads.
4. Pick **H1 · Dockyard** (Kingfisher is already there) → **Move**.
5. **Reservation Conflict** — berth **H1**, the dates already booked this week.
6. **Cancel** — change the pad. **View Calendar** — close and look at the grid.
7. Pick a free pad (H3 or H5) → **Move**. Sea Sprite’s bar moves.

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
6. **Book another** — pick a berth, Dry stack rack, or Dockyard pad for this owner. **Keep berth** leaves the current space; **Move (free berth)** vacates it. Dockyard asks for a job type. Occupied spaces show **Reservation Conflict**.
7. **Archive** is blocked while a yard job is still open.

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
| **Job types** | Boatyard colours, checklists, QA photos, T&Cs. Each row has a title and a checklist option. **Save**. New jobs copy the lists. |
| **Launch / lift task types** | Dry stack names, checklists, and **Invoice product** (Launch / Lift). That product is what **Create draft invoice** puts on the dry-stack draft. |
| **Checklists** | The option labels under each row (Yard job, Launch, QA photo, …). Add or rename them here, then pick one per item on Job types / Task types. |
| **Products** | Name, price, bank (**Marina** or **Holding**). That bank is the invoice banner. Launch and Lift are Marina. Dockyard fee, labour, and parts are Holding. |

---

## Portal links (they do not expire)

Dry stack:

- [Pelican](http://localhost:5173/portal/demo-pelican-portal) — Priya. Happy-path launch.
- [Tern](http://localhost:5173/portal/demo-tern-portal) — Mark. Account overdue; cannot launch.
- [Heron](http://localhost:5173/portal/demo-heron-portal) — Sarah. Expired insurance; **Save** a future date, then staff **Actions → Approve** to clear.

Boatyard: from a yard job, **Send status link** → **Open as customer** (sign T&Cs). The portal header says **Harbr**.

A bad or expired link shows “This link has expired — ask the marina for a new one.”
