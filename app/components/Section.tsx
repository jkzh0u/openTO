"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { formatDateTime, SECTIONS, timeAgo, type SectionId, type Story } from "../lib/news";
import type { Feed } from "../lib/useNewsFeed";
import FireGuide from "./FireGuide";
import FireMap from "./FireMap";
import GoLineHeading from "./GoLineHeading";
import { useNews } from "./NewsShell";
import PoliceStats from "./PoliceStats";
import { TtcBadge, TtcModeIcons } from "./TtcIcons";
import TtcMiniMap from "./TtcMiniMap";

// The most each front-page column renders. CSS then shows however many fit the screen.
const PREVIEW_COUNTS: Record<SectionId, number> = { police: 10, fire: 10, ttc: 5, go: 5 };

const COLUMN_CLASSES: Partial<Record<SectionId, string>> = {
  fire: "section-page__columns",
  ttc: "section-page__columns section-page__columns--map",
};

function StoryLink({ story, variant }: { story: Story; variant?: "lead" | "compact" }) {
  const { breakingIds, now, openStory } = useNews();

  if (story.ttc) {
    return (
      <button type="button" className="story story--ttc" onClick={() => openStory(story)}>
        <span className="story__ttc-badge">
          <TtcBadge ttc={story.ttc} showStatus />
        </span>
        <span className="story__ttc-body">
          <span className="story__meta">
            {breakingIds.has(story.id) && <span className="story__new">New</span>}
            {story.ttc.scheduledFor
              ? `Starts ${formatDateTime(story.ttc.scheduledFor)}`
              : now !== null && timeAgo(story.time, now)}
          </span>
          <span className="story__headline">{story.ttc.effect}</span>
          {story.ttc.detail && <span className="story__ttc-detail">{story.ttc.detail}</span>}
        </span>
      </button>
    );
  }

  return (
    <button type="button" className={`story${variant ? ` story--${variant}` : ""}`} onClick={() => openStory(story)}>
      {story.goLine && <GoLineHeading line={story.goLine} />}
      <span className="story__meta">
        {breakingIds.has(story.id) && <span className="story__new">New</span>}
        {now !== null && timeAgo(story.time, now)}
      </span>
      <span className="story__headline">{story.headline}</span>
      {variant !== "compact" && <span className="story__summary">{story.summary}</span>}
    </button>
  );
}

// Scheduled TTC work stays out of the "what's happening" lists until it starts.
const isHappeningNow = (story: Story) => !story.ttc || story.ttc.inEffect;

function feedNotice(id: SectionId, feed: Feed): string | null {
  if (feed.status === "error") return "The wire went down. Trying again in a minute.";
  if (feed.status === "loading") return "Sending a reporter…";
  return feed.stories.filter(isHappeningNow).length === 0 ? SECTIONS[id].empty : null;
}

// On the fit-to-window layout, ends the list at its last whole story so no gap is left under it.
function useListEndsAtLastRow(contentKey: string) {
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list?.parentElement) return;
    let cancelled = false;

    function snap() {
      if (!list || cancelled) return;
      list.style.maxHeight = "";
      if (getComputedStyle(list).flexWrap !== "wrap") return;

      const box = list.getBoundingClientRect();
      const visible = [...list.children].filter((row) => {
        const rect = row.getBoundingClientRect();
        return rect.width > 0 && rect.left < box.right - 1;
      });
      const lastRow = visible[visible.length - 1];
      if (lastRow) list.style.maxHeight = `${Math.ceil(lastRow.getBoundingClientRect().bottom - box.top)}px`;
    }

    snap();
    document.fonts.ready.then(snap);
    // Watches the column, whose height doesn't depend on the list, so this can't loop.
    const observer = new ResizeObserver(snap);
    observer.observe(list.parentElement);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [contentKey]);

  return listRef;
}

// One column of the front page: the latest few stories and a link to the rest.
export function SectionPreview({ id, after, children }: { id: SectionId; after?: ReactNode; children?: ReactNode }) {
  const feed = useNews().feeds[id];
  const meta = SECTIONS[id];
  const notice = feedNotice(id, feed);
  const preview = feed.stories.filter(isHappeningNow).slice(0, PREVIEW_COUNTS[id]);
  const listRef = useListEndsAtLastRow(preview.map((story) => story.id).join());

  return (
    <section className={`section section--${id}`}>
      <header className="section__head">
        <p className="section__kicker">{meta.kicker}</p>
        <h2 className="section__title">
          <Link href={`/${id}`}>{meta.title}</Link>
          {id === "ttc" && <TtcModeIcons />}
        </h2>
      </header>

      {notice && <p className="section__notice">{notice}</p>}

      <ul ref={listRef} className="section__list">
        {preview.map((story) => (
          <li key={story.id}>
            <StoryLink story={story} variant="compact" />
          </li>
        ))}
      </ul>

      {feed.stories.length > 0 && (
        <Link className="section__all" href={`/${id}`}>
          See all →
        </Link>
      )}

      {after}
      {children && <div className="filler-slot">{children}</div>}
    </section>
  );
}

// A section's own page, with every story.
export function SectionPage({ id }: { id: SectionId }) {
  const feed = useNews().feeds[id];
  const meta = SECTIONS[id];
  const notice = feedNotice(id, feed);
  // TTC alerts read as an even status list, so none of them gets the big lead treatment.
  const happening = feed.stories.filter(isHappeningNow);
  const lead = id === "ttc" ? undefined : happening[0];
  const rest = lead ? happening.slice(1) : happening;
  const scheduled = feed.stories
    .filter((story) => !isHappeningNow(story))
    .sort((a, b) => a.ttc!.scheduledFor!.getTime() - b.ttc!.scheduledFor!.getTime());

  return (
    <main className={`section section--${id} section-page`}>
      <header className="section__head">
        <p className="section__kicker">{meta.kicker}</p>
        <h2 className="section__title section-page__title">
          {meta.title}
          {id === "ttc" && <TtcModeIcons />}
        </h2>
      </header>

      {id === "police" && <PoliceStats />}

      <div className={COLUMN_CLASSES[id]}>
        <div>
          {notice && <p className="section__notice">{notice}</p>}
          {lead && <StoryLink story={lead} variant="lead" />}
          <ul className="section__list section__list--grid">
            {rest.map((story) => (
              <li key={story.id}>
                <StoryLink story={story} />
              </li>
            ))}
          </ul>
          {scheduled.length > 0 && (
            <>
              <h3 className="section__subhead">Scheduled</h3>
              <ul className="section__list section__list--grid">
                {scheduled.map((story) => (
                  <li key={story.id}>
                    <StoryLink story={story} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {id === "fire" && (
          <div className="section-page__rail">
            <FireMap />
            <FireGuide />
          </div>
        )}
        {id === "ttc" && <TtcMiniMap />}
      </div>
    </main>
  );
}
