# Harbr yard prototype — workflow

One file for the whole click-through: the **Elena wants antifoul** story, extra scenes, and the product rules they sit on.

Open [http://localhost:5173](http://localhost:5173). All data is fake. If a boat is already mid-flow: bottom-left **MS** → **Reset demo**.

---

## How to walk it

1. **Settings → Demo story** (or user menu **MS** → Demo story).
2. **Reset and start story**.
3. Read the bar at the bottom. Click **Next**. Each beat opens the exact screen and boat.

The in-app story is the source of truth for clicks. This file is the same flow written down, plus the extra scenes.

Agent / click hooks: `[data-start-story]`, `[data-story-next]`, `[data-story-back]`, `[data-story-done]`, `[data-story-open={beat}]`. URLs use `?story=antifoul&beat=<id>` and `res=` ids.

---

## Rules that apply everywhere

- **Calendar is water only.** Dry stack and Dockyard are Operations workspaces. The Calendar does not send a water-berth boat onto land.
- **Land work is lift → do the work or stay → launch.** Lift and launch are not a job type. Job types are **Antifoul**, **DIY**, **Engine service**.
- **Travel lift** (Dockyard) and **fork lift** (Dry stack) are machine tabs — one vessel per slot.
- **Office** is Calendar and the land workspaces. **Yard crew** is `/yard` (user menu → Open yard crew) — no office sidebar, no prices, no invoices.
- **Customer updates are email only.** There is no customer portal.
- **Invoice after the work is Done**, not on every tap. Yard products → banner **Holding**. Lift/Launch products → banner **Marina**.
- Settings → **Modules & words** turns Boatyard and Dry stack on or off independently.
- Skip grey menu items (**Home**, **Map**, **Owners**, …). **Dashboard → Actions** is live.

---

## Cast

| Boat | Owner | Where | Role in the demo |
|------|--------|--------|------------------|
| **Sea Sprite** | Elena Voss | Dockyard **H4** | Main story — antifoul. Lift **done** 08:00, launch **14:00** |
| **Riviera** | Tom Bridger | Dockyard **H2** | DIY. Launch **in progress** 15:00 |
| **Kingfisher** | Liam Ortiz | Dockyard **H1** | Engine service, contractor Marine Works. Launch **16:00** |
| **Petrel** | Arun Patel | Dockyard **H3** | Arriving today — lift **scheduled** 10:00, launch Saturday |
| **Teal** | Felix Diaz | Dockyard **H6** | Engine. Lift **in progress** 11:00, T&Cs signed |
| **Plover** | Ruth Owens | Dockyard **H7** | DIY. Customer **requested** launch 12:00 |
| **Sanderling** | Chloe Moore | Dockyard **H8** | DIY done. Launch **07:00** already Done |
| **Pelican** | Priya Shah | Dry stack **DS1** | Rack → water, Saturday run |
| **Tern** | Mark Chen | Dry stack **DS2** | Do not launch — account overdue. Request waiting |
| **Heron** | Sarah Quinn | Dry stack **DS3** | Do not launch — insurance expired. Request waiting |
| **Dunlin** | Sam Brooks | Dry stack **DS4** | Lift **done** 07:00, launch **in progress** 12:00 |
| **Kestrel** | Maya Nguyen | Dry stack **DS5** | Launch **scheduled** 11:00 |
| **Curlew** | Owen Reed | Dry stack **DS6** | Request waiting |
| **Osprey** | Nora Blake | Calendar **A10** | In the water. Lift back **scheduled** 13:00 |
| **Shearwater** | Ava Kim | Calendar **A14** | To be approved |
| **Mako** | James Hale | Calendar **A12** | Water berth (full reservation sheet) |

Empty pad for a new yard booking: Dockyard **H5**. Empty rack: Dry stack **DS7**.

---

# Main story — Elena wants antifoul

Elena Voss just rang. She wants **Sea Sprite** antifouled this week. You already put her on pad **H4**. Follow that one job: lift, the work, the invoice, launch.

**Reset and start story** lands on beat 1.

### 1. The call — Elena Voss just rang

She wants Sea Sprite antifouled this week. The job is **Antifoul** — marina crew. Every land stay lifts first, does the work, then launches.

- **Do:** Confirm the job is Antifoul. **Lift then launch** shows **08:00** lift done and a **14:00** launch.
- **Open:** Dockyard → Job details → Sea Sprite
- **URL:** `/operations/boatyard?tab=jobs&res=res-h4-sea-sprite&story=antifoul&beat=call`

### 2. The lift — the travel lift is the machine

Sea Sprite came out at 08:00. The Travel lift tab is the hourly book — one vessel per slot. It is not a job type.

- **Do:** Find Sea Sprite’s **08:00** lift on the travel lift.
- **Open:** Dockyard → Travel lift
- **URL:** `/operations/boatyard?tab=travel-lift&story=antifoul&beat=machine`

### 3. The yard — crew paint the hull

Yard crew work on a separate page. No office sidebar. No prices. They wash, mask, and apply antifoul.

- **Do:** Sea Sprite is already open. Tick **Wash hull**, **Mask fittings**, **Apply antifoul**. Add hours if you want.
- **Open:** Yard crew
- **URL:** `/yard?boat=Sea%20Sprite&res=res-h4-sea-sprite&story=antifoul&beat=crew`

### 4. The bill — office raises the draft

After the work is logged, office creates the invoice. Labour, parts, dockyard fee. Banner **Holding**. Yard never sees `$`.

- **Do:** **Create draft invoice** on Sea Sprite. Banner should say **Holding**.
- **Open:** Dockyard → Job details → Sea Sprite
- **URL:** `/operations/boatyard?tab=jobs&res=res-h4-sea-sprite&story=antifoul&beat=invoice`

What is on the draft:

- Hours and materials logged on the job
- **Dockyard fee × nights on the pad** (minimum 1 day)
- **Never** a **Berth night**. Water rent stays on the Marina berth
- Mix Marina and Holding products → **Mixed banks — review lines**

Yard cannot open this screen (“You cannot view invoices”).

### 5. Back in the water — launch when the paint is ready

Elena wants her back in today. The 14:00 launch is already on the travel lift. One vessel per slot.

- **Do:** Today → **Launch** → Sea Sprite **14:00** → **Start** → **Done**.
- **Open:** Dockyard → Today
- **URL:** `/operations/boatyard?tab=launch&story=antifoul&beat=launch`

**Finish** returns to Demo story. Extra scenes below stay under **More scenes**.

---

# Extra scenes — Dry stack

Racks on land. Launch back into the water from **Dry stack**. Open **Operations → Dry stack**. **Today** has Requests / Launch / Lift. **Racks** is occupancy. **Fork lift** is the hourly schedule.

Monthly rack storage stays on the booking. It is **not** on a Lift/Launch draft.

Office invoices Lift and Launch after the trips are **Done**. Do not auto-invoice on every Done, or a busy Saturday would create ~50 drafts. Lines are **Launch** and/or **Lift** ($85 each). Banner **This invoice → Marina**. If a task type has no product, Settings → **Launch / lift task types** → **Invoice product** → **Save**.

---

## Dry stack: rack → water (Pelican)

The boat is already on a rack. Launch her from Dry stack.

1. **More scenes → Dry stack: rack → water**, or Dry stack → **Racks** → **Pelican**.
2. Dry stack → **Today** → **Add task** → search **Pelican** → task type **Launch** → pick a time (e.g. **14:00**) → **Save**.
3. **Launch** tab: that Launch. **Start**, then **Done**. Badge: **Stored → Launched**.
4. On that row: **Invoice Lift + Launch** (if a Lift is still unbilled). One draft: **Lift** + **Launch**. Banner **Marina**.
5. Dry stack → **Racks**: Pelican is on **In the water**. Boat workspace still invoices unbilled Lift/Launch.

**Open:** `/operations/dry-stack?tab=occupancy&script=rack`

---

## Staff logs a launch

The boat is already on the rack. Phone or email → marina books the fork-lift slot → yard puts the boat in → owner is emailed.

1. Dry stack → **Today** → **Add task**. Search **Pelican**, **Launch**, pick a free fork-lift slot → **Save**. Customer is emailed.
2. **Launch** tab — Pelican. **Start**, then **Done**. Emails go out at each step.
3. Boat on the row (or Racks → Pelican) → **Create draft invoice** (Launch, Marina).

**Other way in:** boat workspace → **Email status** → **Send email**.

**Open:** `/operations/dry-stack`

---

## Do not launch

Overdue account or expired insurance blocks **Start** until office clears it. Nothing to invoice until the boat actually moves.

### Overdue (Tern)

1. Dry stack → **Racks** → **Tern** (Mark Chen). Red **Do not launch** / **Overdue**. **Start** on Launch stays grey.
2. Status is **Stored**.

### Expired insurance (Heron)

1. Dry stack → **Racks** → **Heron** (Sarah Quinn). Same red card, reason **Insurance expired**.
2. Office updates insurance on the boat workspace. If that edit is pending, **Dashboard → Actions → Pending Changes** → **Approve**.

### Manual hold (office only)

1. Open a clear dry-stack boat already on the rack (e.g. **Curlew**).
2. **Set manual DNL** — type a reason.
3. **Clear override** — removes that hold. Overdue / insurance blocks still apply if they are on.

**Open:** `/operations/dry-stack?tab=occupancy&boat=Tern` (Heron: `boat=Heron`)

---

## Busy Saturday

Replaces a printed run sheet. One vessel per fork-lift slot. Invoice **after** the boat’s trips are Done.

1. **More scenes → Busy Saturday**. Date becomes **this Saturday**.
2. Unique 30-minute fork-lift slots on **Launch** and **Lift**.
3. Use **Pelican** (already on the rack):
   - **Launch** tab: **09:00 Launch** → **Start** → **Done**. Badge: **Stored → Launched**.
   - **Departed** — the owner has left the marina.
   - **Lift** tab: **15:00 Lift** → **Start** → **Done**. Badge: back to **Stored**.
4. Click the left side of a row to open the checklist.
5. **Add task** — search a customer, pick Launch or Lift, pick a time, **Save**.
6. Pelican boat workspace → **Create draft invoice**. Two lines: **Launch** and **Lift**. Banner **Marina**.
7. **Fork lift** tab: click a free hour to book, or a booked hour to open that boat. Taken slots conflict.

**Start** / **Done** stay grey on Tern and Heron unless you already cleared those. If Pelican is already in the water from an earlier demo, **Reset demo** first.

**Open:** `/operations/dry-stack?script=saturday`

---

# Extra scenes — Dockyard

The yard is for repair. Book onto it from **Dockyard**, finish the job, then launch back to the water.

Open **Operations → Dockyard**. Tabs: **Today**, **Travel lift**, **Yard**, **Job details**. **Today** has Requests / Launch / Lift. **Travel lift** is the hourly schedule. **Yard** is occupancy. **Job details** is the repair job list.

Open **Operations → Dry stack**. Tabs: **Today**, **Fork lift**, **Racks**.

Sequence: **request → lift onto pad (travel lift) → repair job → launch back to water**. Occupied pads cannot be double-booked.

The main story already covers Sea Sprite antifoul. These scenes cover booking a new pad, moving, and a contractor job.

---

## Yard job — crew logs, office invoices

Same job as the main story (Sea Sprite on H4), without the story bar.

1. **More scenes → Yard job**, or Dockyard → **Job details** → **Sea Sprite**.
2. Job is open: checklist, hours, materials, lift / launch times.
3. User menu → **Open yard crew**. Search **Sea Sprite**. Tick checklist, **Add** hours/materials, tick photos. No `$`.
4. Back on Dockyard, Sea Sprite → **Create draft invoice**. Labour, parts, **Dockyard fee**. Banner **Holding**.

**Open:** `/operations/boatyard?tab=jobs&script=yard-job`

---

## Book a pad job — owner must sign T&Cs

Book onto an empty dockyard pad. The job cannot be marked done until T&Cs are signed. A same-day lift still bills **1 × Dockyard fee** even if you skip hours.

1. Dockyard → **Yard** → empty **H5**.
2. Pick a boat that is not on a water berth (**Gannet**). Job type **Engine service**, lift **09:00**. Lift and launch wrap the job — they are not a job type.
3. Occupied pads say **unavailable** (H1 Kingfisher, H2 Riviera, H3 Petrel, H4 Sea Sprite, H6 Teal, H7 Plover, H8 Sanderling).
4. To see **Reservation Conflict**: pick **H4** → **Confirm**, then **Cancel**.
5. **Confirm**. The bar is on the pad.
6. T&Cs **Not sent** → **Send T&Cs** (email). **Mark job done** stays off until **Mark signed**.
7. Shortcut: **Mark signed** on the job (no customer portal).
8. Optional: Yard crew → tick checklist / photos, **Add** hours. No `$`.
9. When ready: **Schedule launch / Change launch date** — pick a travel-lift slot. Completing that **Launch** puts her back in the water and frees the pad. Owner is emailed.
10. **Create draft invoice**. Dockyard fee is included. Berth night is not. Banner **Holding**.

**Open:** `/operations/boatyard?tab=yard`

---

## Move a boat — conflict check

**Move** from a water berth stays on water. From Dockyard you can move between pads. Occupied spaces are **unavailable**. Same **Reservation Conflict** dialog as live Harbr.

1. Dockyard → **Job details** → Sea Sprite → **Move**.
2. Pick **H1 · Dockyard** (Kingfisher is there) → **Move**. Conflict dialog. **Cancel**.
3. Pick a free pad (**H5**) → **Move**. The bar moves.

**Edit** (same-type berth only) uses the same check.

Land boat workspaces hide reservation chrome (Edit / Move / Archive). Use the Calendar sheet for a water boat, or **More scenes** if Move is on that flow.

**Open:** `/operations/boatyard?tab=jobs&script=yard-job`

---

## Contractor, relaunch, photos

1. Dockyard → **Job details** → **Kingfisher**. Job type is **Engine service**. Who does the work = **Contractor** (**Marine Works**).
2. **Notify** — simulated email (shows under Messages on the Calendar sheet).
3. Change to **DIY** or **Marina** — the calendar bar tag updates.
4. **Change launch date** — later date and a free travel-lift slot. Owner is emailed.
5. Travel lift tab shows the booked hours.
6. Yard crew → **Kingfisher** → tick the two photo boxes. **Mark job done** waits until T&Cs are signed.
7. Back Office → **Create draft invoice**.

**Open:** `/operations/boatyard?tab=jobs&script=contractor`

---

# Extra scenes — Office

These sit on every boat.

---

## Approve owner changes

Contact and insurance do not apply instantly. Staff review the diff on **Actions**.

1. Dry stack → **Racks** → **Heron**: expired insurance — DNL until office updates the date.
2. **Dashboard → Actions** → **Pending Changes** if any owner edits are waiting.
3. **Reject** needs a reason. **Approve** applies the date and can clear the insurance DNL.

**Open:** `/dashboard/actions`

---

## Approve a booking

1. Calendar **A14 Shearwater** (**To be approved**), or **Actions → Pending Approvals** → **Review Agreement**.
2. Read the fake berth agreement → **Approve reservation**. Header becomes **Approved**.
3. Then you get **View Agreement**, **Edit**, **Move**, **Archive**.
4. **Edit** = dates and same-type berth. **Move** from a water berth stays on water.
5. **Book another** — from a water berth you only get other berths. From Dockyard you can book another pad.
6. **Archive** is blocked while a yard job is still open.

**Open:** `/operations/calendar?script=approve`

---

## Book onto Dry stack or Dockyard

Add a boat onto an empty rack or pad from that module. Water berth boats stay on the Calendar.

1. Dry stack → **Racks** → empty **DS7**. Pick a boat that is not on a water berth → **Confirm**.
2. Dockyard → **Yard** → empty **H5**. Job type required. Occupied pads show **Reservation Conflict**.
3. Boat workspace **Book another** — from a water berth you only get other berths. From Dockyard you can book another pad.

**Open:** `/operations/dry-stack?tab=occupancy`

---

## Message the owner

On a **Calendar** reservation sheet (land workspaces hide this chrome):

1. Click any water boat, or use Pelican from Dry stack occupancy if the sheet is available.
2. **Email status** → **Send email**. Logged under **Messages**.
3. **Messages** → **Send message** → pick a template → **Send** (email).
4. **Activity** is the staff log. **Reservation related notes** — type, **Save**.

**Open:** `/operations/dry-stack?tab=occupancy&boat=Pelican`

---

## Settings

Left menu **Settings → General Info**.

| Tab | Try this |
|-----|----------|
| **Modules & words** | Turn **Boatyard** or **Dry stack** off — that module disappears. Rename the labels. Turn off auto-block for overdue / insurance — Tern / Heron unblock. |
| **Berths** | Change a space’s kind (Berth / Dockyard / Dry stack). |
| **Job types** | Antifoul, DIY, Engine service. Lift and launch are not a job type. |
| **Launch / lift task types** | Per-module Launch / Lift, checklists, and **Invoice product**. |
| **Equipment** | Travel lift and fork lift hours and slot length. One vessel per slot. |
| **Checklists** | The option labels under each row. |
| **Products** | Name, price, bank (**Marina** or **Holding**). That bank is the invoice banner. |

**Open:** `/settings/general-info`

---

## Yard crew

`/yard` — not in the office sidebar. User menu → **Open yard crew**. No prices, no invoices.
