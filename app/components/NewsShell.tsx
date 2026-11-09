"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Story } from "../lib/news";
import { useNewsFeed, useNow, useSubwayIssues, type Feeds } from "../lib/useNewsFeed";
import BreakingBanner from "./BreakingBanner";
import Masthead from "./Masthead";
import StoryDialog from "./StoryDialog";

type News = {
  feeds: Feeds;
  subway: ReturnType<typeof useSubwayIssues>;
  breakingIds: Set<string>;
  now: number | null;
  openStory: (story: Story) => void;
};

const NewsContext = createContext<News | null>(null);

export function useNews(): News {
  const news = useContext(NewsContext);
  if (!news) throw new Error("useNews must be used inside NewsShell");
  return news;
}

// Lives in the root layout so polling and the banner carry on across page changes.
export default function NewsShell({
  children,
  initialFeeds,
  serverNow,
}: {
  children: ReactNode;
  initialFeeds: Feeds;
  serverNow: number;
}) {
  const { feeds, breaking } = useNewsFeed(initialFeeds);
  const subway = useSubwayIssues();
  const [selected, setSelected] = useState<Story | null>(null);
  const now = useNow(serverNow);
  const newestForBanner = breaking.find((story) => story.section !== "go");
  const news = useMemo(
    () => ({ feeds, subway, now, openStory: setSelected, breakingIds: new Set(breaking.map((story) => story.id)) }),
    [feeds, subway, now, breaking]
  );

  return (
    <NewsContext value={news}>
      {/* Keyed on the newest story so a fresh arrival restarts the banner on its section. */}
      <BreakingBanner
        key={newestForBanner?.id ?? "start"}
        feeds={feeds}
        now={now}
        startWith={newestForBanner?.section}
        onOpen={setSelected}
      />

      <div className="paper">
        <Masthead now={now} />
        {children}
        <footer className="colophon">
          Live data from Toronto Police Service, Toronto Fire Services, the TTC and Metrolinx. Weather by{" "}
          <a href="https://open-meteo.com/">Open-Meteo</a>. Not an actual newspaper.
        </footer>
      </div>

      {selected && <StoryDialog story={selected} onClose={() => setSelected(null)} />}
    </NewsContext>
  );
}
