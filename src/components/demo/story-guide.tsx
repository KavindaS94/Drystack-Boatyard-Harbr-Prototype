import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  HARBR_STORY,
  HARBR_STORY_BEATS,
  HARBR_STORY_ID,
  storyBeatById,
  storyBeatIndex,
  storyBeatUrl,
} from "../../lib/demo-story";

export function StoryGuide() {
  const location = useLocation();
  const [params] = useSearchParams();
  if (params.get("story") !== HARBR_STORY_ID) return null;
  if (location.pathname.startsWith("/settings/demo-routines")) return null;

  const beat = storyBeatById(params.get("beat"));
  if (!beat) return null;

  const index = storyBeatIndex(beat.id);
  const previous = index > 0 ? HARBR_STORY_BEATS[index - 1] : undefined;
  const next = index >= 0 && index < HARBR_STORY_BEATS.length - 1 ? HARBR_STORY_BEATS[index + 1] : undefined;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"
      data-story-guide
      data-story-beat={beat.id}
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {HARBR_STORY.title} · {index + 1} of {HARBR_STORY_BEATS.length} · {beat.chapter}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">{beat.title}</p>
          <p className="mt-1 text-sm text-neutral-600">{beat.story}</p>
          <p className="mt-1 text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">Do: </span>
            {beat.do}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {previous ? (
            <Link
              to={storyBeatUrl(previous)}
              data-story-back
              className="inline-flex h-8 items-center rounded-md border border-neutral-200 px-3 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Back
            </Link>
          ) : null}
          {next ? (
            <Link
              to={storyBeatUrl(next)}
              data-story-next
              className="inline-flex h-8 items-center rounded-md bg-[hsl(252,75%,70%)] px-3 text-sm text-white hover:bg-[hsl(252,75%,60%)]"
            >
              Next
            </Link>
          ) : (
            <Link
              to="/settings/demo-routines"
              data-story-done
              className="inline-flex h-8 items-center rounded-md bg-[hsl(252,75%,70%)] px-3 text-sm text-white hover:bg-[hsl(252,75%,60%)]"
            >
              Finish
            </Link>
          )}
          <Link
            to="/settings/demo-routines"
            className="inline-flex h-8 items-center px-2 text-sm text-neutral-500 hover:text-neutral-800"
          >
            Exit
          </Link>
        </div>
      </div>
    </div>
  );
}
