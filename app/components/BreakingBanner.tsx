"use client";

import { useEffect, useState } from "react";
import { currentTtcDisruption, SECTIONS, type SectionId, type Story } from "../lib/news";
import type { Feeds } from "../lib/useNewsFeed";
import { TtcBadge } from "./TtcIcons";

const ROTATE_MS = 6_000;
const TTC_ROTATE_MS = 10_000; // The TTC is holding here momentarily.

type Slot = { section: SectionId; story: Story | null };

function bannerSlots(feeds: Feeds, now: number | null): Slot[] {
  const slots: Slot[] = [];
  for (const section of ["police", "fire"] as const) {
    const [story] = feeds[section].stories;
    if (story) slots.push({ section, story });
  }
  if (feeds.ttc.status === "ready" || feeds.ttc.stories.length > 0) {
    slots.push({ section: "ttc", story: currentTtcDisruption(feeds.ttc.stories, now) });
  }
  return slots;
}

type Props = {
  feeds: Feeds;
  now: number | null;
  startWith?: SectionId;
  onOpen: (story: Story) => void;
};

export default function BreakingBanner({ feeds, now, startWith, onOpen }: Props) {
  const slots = bannerSlots(feeds, now);
  const count = slots.length;
  const [index, setIndex] = useState(() => Math.max(0, slots.findIndex((slot) => slot.section === startWith)));
  const [paused, setPaused] = useState(false);

  const slot: Slot | undefined = slots[index % count];
  const story = slot?.story ?? null;
  const isTtc = slot?.section === "ttc";

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setTimeout(() => setIndex((current) => current + 1), isTtc ? TTC_ROTATE_MS : ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, count, paused, isTtc]);

  let placeholder = "Sending reporters to the scene…";
  if (isTtc) placeholder = "TTC reports no disruptions. Developing.";

  return (
    <div
      className={isTtc ? "breaking breaking--ttc" : "breaking"}
      role="region"
      aria-label="Breaking news"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <strong className="breaking__flag">{isTtc && story ? "BREAKING DOWN NEWS:" : "BREAKING NEWS:"}</strong>

      {story ? (
        <button key={story.id} type="button" className="breaking__story" onClick={() => onOpen(story)}>
          {story.ttc ? (
            <>
              <TtcBadge ttc={story.ttc} />
              {story.ttc.effect}
              {story.ttc.detail && `: ${story.ttc.detail}`}
            </>
          ) : (
            <>
              <span className="breaking__section">{SECTIONS[story.section].title}</span>
              {story.headline}
            </>
          )}
        </button>
      ) : (
        <span key={placeholder} className="breaking__story">
          {placeholder}
        </span>
      )}

      {isTtc && story && (
        <span className="breaking__sign">
          Days since last delay <b>0</b>
        </span>
      )}
    </div>
  );
}
