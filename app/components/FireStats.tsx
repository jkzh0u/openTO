"use client";

import { useMemo, type ReactNode } from "react";
import { unitType, type Story } from "../lib/news";
import FireGuide from "./FireGuide";
import FireMap from "./FireMap";
import { useNews } from "./NewsShell";
import { Stat } from "./PoliceStats";

const AGE_BANDS = [
  { label: "Under 15 min", below: 15 },
  { label: "15–30 min", below: 30 },
  { label: "30–60 min", below: 60 },
  { label: "1–2 hr", below: 120 },
  { label: "2+ hr", below: Infinity },
];

function rank(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function formatDuration(minutes: number) {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

function computeStats(stories: Story[], now: number) {
  const calls = stories.filter((story) => story.fire);
  if (calls.length === 0) return null;

  const units = calls.flatMap((call) => call.fire!.units);
  const ages = calls.map((call) => Math.max(0, Math.floor((now - call.time.getTime()) / 60_000)));

  return {
    total: calls.length,
    unitTotal: units.length,
    oldest: Math.max(...ages),
    types: rank(calls.map((call) => call.fire!.type)),
    unitTypes: rank(units.map(unitType)),
    bands: AGE_BANDS.map((band, index) => ({
      name: band.label,
      count: ages.filter((age) => age < band.below && age >= (AGE_BANDS[index - 1]?.below ?? 0)).length,
    })),
  };
}

function NumberGroup({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <section className="count-group">
      <h3>{title}</h3>
      <p>
        {items.map(({ name, count }) => (
          <span key={name}>
            <b>{count}</b> {name}
          </span>
        ))}
      </p>
    </section>
  );
}

export default function FireStats({ children }: { children: ReactNode }) {
  const { feeds, now } = useNews();
  const stories = feeds.fire.stories;
  const stats = useMemo(() => (now === null ? null : computeStats(stories, now)), [stories, now]);
  if (!stats) return <>{children}</>;

  const [topType] = stats.types;

  return (
    <div aria-label="Fire incidents">
      <div className="stats__tiles">
        <Stat value={String(stats.total)} label="Active incidents" />
        <Stat value={String(stats.unitTotal)} label="Units dispatched" />
        <Stat value={formatDuration(stats.oldest)} label="Longest-running call" />
        <Stat value={topType.name} label={`Most common, ${topType.count} ${topType.count === 1 ? "call" : "calls"}`} />
      </div>

      <div className="fire-layout">
        <FireMap />
        <div className="fire-layout__main">
          <div className="count-groups">
            <NumberGroup title="Incident types" items={stats.types} />
            <NumberGroup title="Units out" items={stats.unitTypes} />
            <NumberGroup title="How long calls have been open" items={stats.bands} />
            <p className="stats__note">
              The feed only lists calls still active, so these numbers show right now, not daily totals.
            </p>
          </div>
          {children}
        </div>
        <FireGuide />
      </div>
    </div>
  );
}
