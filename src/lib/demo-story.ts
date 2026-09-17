export const HARBR_STORY_ID = "antifoul";

export interface StoryBeat {
  id: string;
  chapter: string;
  title: string;
  story: string;
  do: string;
  to: string;
  openLabel: string;
}

export const HARBR_STORY = {
  id: HARBR_STORY_ID,
  title: "Elena wants antifoul",
  intro:
    "Elena Voss just rang. She wants Sea Sprite antifouled this week. Follow that one job — book is already on H4 — then lift, the work, the invoice, and launch.",
} as const;

export const HARBR_STORY_BEATS: StoryBeat[] = [
  {
    id: "call",
    chapter: "The call",
    title: "Elena Voss just rang",
    story:
      "She wants Sea Sprite antifouled this week. You put her on pad H4. The job is Antifoul — marina crew. Every land stay lifts first, does the work, then launches.",
    do: "Confirm the job is Antifoul. Lift then launch shows 08:00 lift done and a 14:00 launch.",
    to: "/operations/boatyard?tab=jobs&res=res-h4-sea-sprite",
    openLabel: "Open Sea Sprite",
  },
  {
    id: "machine",
    chapter: "The lift",
    title: "The travel lift is the machine",
    story:
      "Sea Sprite came out at 08:00. The Travel lift tab is the hourly book — one vessel per slot. It is not a job type.",
    do: "Find Sea Sprite’s 08:00 lift on the travel lift.",
    to: "/operations/boatyard?tab=travel-lift",
    openLabel: "Open travel lift",
  },
  {
    id: "crew",
    chapter: "The yard",
    title: "Crew paint the hull",
    story:
      "Yard crew work on a separate page. No office sidebar. No prices. They wash, mask, and apply antifoul.",
    do: "Sea Sprite is already open. Tick Wash hull, Mask fittings, Apply antifoul. Add hours if you want.",
    to: "/yard?boat=Sea%20Sprite&res=res-h4-sea-sprite",
    openLabel: "Open yard crew",
  },
  {
    id: "invoice",
    chapter: "The bill",
    title: "Office raises the draft",
    story:
      "After the work is logged, office creates the invoice. Labour, parts, dockyard fee. Banner Holding. Yard never sees $.",
    do: "Create draft invoice on Sea Sprite. Banner should say Holding.",
    to: "/operations/boatyard?tab=jobs&res=res-h4-sea-sprite",
    openLabel: "Back to Sea Sprite",
  },
  {
    id: "launch",
    chapter: "Back in the water",
    title: "Launch when the paint is ready",
    story:
      "Elena wants her back in today. The 14:00 launch is already on the travel lift. One vessel per slot.",
    do: "Today → Launch → Sea Sprite 14:00 → Start → Done.",
    to: "/operations/boatyard?tab=launch",
    openLabel: "Open Today board",
  },
];

export function storyBeatById(id: string | null): StoryBeat | undefined {
  if (!id) return undefined;
  return HARBR_STORY_BEATS.find((beat) => beat.id === id);
}

export function storyBeatIndex(id: string | null): number {
  if (!id) return -1;
  return HARBR_STORY_BEATS.findIndex((beat) => beat.id === id);
}

export function storyBeatUrl(beat: StoryBeat): string {
  const url = new URL(beat.to, "https://story.local");
  url.searchParams.set("story", HARBR_STORY_ID);
  url.searchParams.set("beat", beat.id);
  return `${url.pathname}${url.search}`;
}
