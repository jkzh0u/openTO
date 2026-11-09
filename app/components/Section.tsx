"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SECTIONS, timeAgo, type SectionId, type Story } from "../lib/news";
import type { Feed } from "../lib/useNewsFeed";
import FireGuide from "./FireGuide";
import GoLineHeading from "./GoLineHeading";
import { useNews } from "./NewsShell";
import PoliceStats from "./PoliceStats";
import { TtcBadge, TtcModeIcons } from "./TtcIcons";

const PREVIEW_COUNT = 5;

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
            {now !== null && timeAgo(story.time, now)}
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

function feedNotice(id: SectionId, feed: Feed): string | null {
  if (feed.status === "error") return "The wire went down. Trying again in a minute.";
  if (feed.status === "loading") return "Sending a reporter…";
  return feed.stories.length === 0 ? SECTIONS[id].empty : null;
}

// One column of the front page: the latest few stories and a link to the rest.
export function SectionPreview({ id, children }: { id: SectionId; children?: ReactNode }) {
  const feed = useNews().feeds[id];
  const meta = SECTIONS[id];
  const notice = feedNotice(id, feed);
  const preview = feed.stories.slice(0, PREVIEW_COUNT);

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

      <ul className="section__list">
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
  const lead = id === "ttc" ? undefined : feed.stories[0];
  const rest = lead ? feed.stories.slice(1) : feed.stories;

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

      <div className={id === "fire" ? "section-page__columns" : undefined}>
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
        </div>
        {id === "fire" && <FireGuide />}
      </div>
    </main>
  );
}
