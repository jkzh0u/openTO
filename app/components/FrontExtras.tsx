"use client";

import Link from "next/link";
import { activeTtcDisruptions, type SectionId } from "../lib/news";
import GoLineHeading from "./GoLineHeading";
import { useNews } from "./NewsShell";

function formatMinutes(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min late` : `${minutes} min late`;
}

export function GoLineStatus() {
  const { stories, goLines } = useNews().feeds.go;
  if (!goLines) return null;

  // Lines with problems go first, since a short box only has room for the top few.
  const rows = goLines
    .map((line) => {
      const lineStories = stories.filter((story) => story.goLine?.name === line.name);
      const worst = Math.max(0, ...lineStories.map((story) => story.delayMinutes ?? 0));
      return { line, worst, hasAlert: lineStories.length > 0 };
    })
    .sort((a, b) => b.worst - a.worst || Number(b.hasAlert) - Number(a.hasAlert));

  return (
    <aside className="filler filler--fit">
      <header className="filler__head">
        <p className="section__kicker">All lines</p>
        <h3 className="filler__title">Line Status</h3>
      </header>
      <ul className="filler__list">
        {rows.map(({ line, worst, hasAlert }) => (
          <li key={line.name} className="filler-row">
            <GoLineHeading line={line} />
            <span className={worst > 0 || hasAlert ? "filler-row__value" : "filler-row__quiet"}>
              {worst > 0 ? formatMinutes(worst) : hasAlert ? "Service alert" : "No delays"}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Tile({ id, value, label }: { id: SectionId; value: string; label: string }) {
  return (
    <Link href={`/${id}`} className={`tile section--${id}`}>
      <span className="tile__value">{value}</span>
      <span className="tile__label">{label}</span>
    </Link>
  );
}

export function ByTheNumbers() {
  const { feeds, subway, now } = useNews();
  const known = (id: SectionId) => feeds[id].status === "ready" || feeds[id].stories.length > 0;
  const slowZones = subway.issues.filter((issue) => issue.kind === "slow").length;
  const ttcProblems = activeTtcDisruptions(feeds.ttc.stories, now).length + slowZones;

  const recentPolice = feeds.police.stories.filter(
    (story) => now !== null && now - story.time.getTime() <= 3_600_000
  ).length;
  const worstDelay = Math.max(0, ...feeds.go.stories.map((story) => story.delayMinutes ?? 0));

  return (
    <section className="numbers" aria-label="Toronto by the numbers">
      <Tile id="police" value={known("police") ? String(recentPolice) : "–"} label="Police calls, last hour" />
      <Tile id="fire" value={known("fire") ? String(feeds.fire.stories.length) : "–"} label="Active fire incidents" />
      <Tile
        id="ttc"
        value={known("ttc") ? String(ttcProblems) : "–"}
        label={subway.loaded ? `Things wrong with the TTC, including ${slowZones} slow zones` : "Things wrong with the TTC"}
      />
      <Tile id="go" value={known("go") ? `${worstDelay} min` : "–"} label="Worst GO delay" />
    </section>
  );
}
