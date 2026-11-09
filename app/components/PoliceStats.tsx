"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { timeAgo, type Story } from "../lib/news";
import divisionMap from "../lib/policeDivisions.json";
import { useNews } from "./NewsShell";

const BIN_MS = 15 * 60_000;
const MAX_COLUMN_PX = 110;
const NEAREST_DOT_PX = 28;
const TORONTO = "America/Toronto";

const LAKE_LABEL = { lat: 43.625, lng: -79.25 };

function mapPosition(lat: number, lng: number) {
  const { west, east, south, north } = divisionMap.bounds;
  return { x: ((lng - west) / (east - west)) * 100, y: ((north - lat) / (north - south)) * 100 };
}

function rank(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function binLabel(start: number) {
  const date = new Date(start);
  const onTheHour = date.getMinutes() === 0;
  return {
    tick: onTheHour ? date.toLocaleTimeString("en-CA", { timeZone: TORONTO, hour: "numeric" }) : "",
    full: date.toLocaleTimeString("en-CA", { timeZone: TORONTO, hour: "numeric", minute: "2-digit" }),
  };
}

function computeStats(stories: Story[]) {
  const calls = stories.filter((story) => story.police);
  if (calls.length < 2) return null;

  const times = calls.map((call) => call.time.getTime()).sort((a, b) => a - b);
  const oldest = times[0];
  const newest = times[times.length - 1];
  const averageGap = (newest - oldest) / (times.length - 1) / 60_000;
  const longestGap = Math.max(...times.slice(1).map((time, i) => time - times[i])) / 60_000;

  const firstBin = Math.floor(oldest / BIN_MS);
  const lastBin = Math.floor(newest / BIN_MS);
  const counts = new Map<number, number>();
  for (const time of times) {
    const bin = Math.floor(time / BIN_MS);
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  // The oldest bin is cut off by the feed's call limit, so it would undercount.
  const startBin = lastBin - firstBin >= 3 ? firstBin + 1 : firstBin;
  const bins = Array.from({ length: lastBin - startBin + 1 }, (_, i) => ({
    ...binLabel((startBin + i) * BIN_MS),
    count: counts.get(startBin + i) ?? 0,
  }));

  return {
    calls,
    averageGap,
    longestGap,
    hours: Math.max(1, Math.ceil((newest - oldest) / 3_600_000)),
    bins,
    types: rank(calls.map((call) => call.police!.type)),
    divisions: rank(calls.map((call) => call.police!.division)),
  };
}

function RankedBars({ title, items, total }: { title: string; items: { name: string; count: number }[]; total: number }) {
  const top = items.slice(0, 10);
  const max = top[0]?.count ?? 1;
  return (
    <figure className="stats__ranked">
      <figcaption className="stats__title">{title}</figcaption>
      <ol className="ranked">
        {top.map(({ name, count }) => (
          <li key={name} className="ranked__row" tabIndex={0}>
            <span className="stats-tip">{Math.round((count / total) * 100)}% of calls</span>
            <span className="ranked__name">{name}</span>
            <span className="ranked__track">
              <span className="ranked__bar" style={{ width: `calc((100% - 2.4rem) * ${count / max})` }} />
              <span className="ranked__value">{count}</span>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function CallsOverTime({ bins }: { bins: NonNullable<ReturnType<typeof computeStats>>["bins"] }) {
  const max = Math.max(...bins.map((bin) => bin.count), 1);
  const peak = bins.findIndex((bin) => bin.count === max);
  return (
    <figure className="stats__time">
      <figcaption className="stats__title">
        Calls over time
        <span className="stats__sub">Every 15 minutes. The latest bar is still filling.</span>
      </figcaption>
      <div className="columns">
        {bins.map((bin, index) => (
          <div key={bin.full} className="columns__slot" tabIndex={0}>
            <span className="stats-tip">
              <b>{bin.count}</b> at {bin.full}
            </span>
            {index === peak && <span className="columns__peak">{bin.count}</span>}
            <span
              className={index === bins.length - 1 ? "columns__bar columns__bar--partial" : "columns__bar"}
              style={{ height: (bin.count / max) * MAX_COLUMN_PX }}
            />
          </div>
        ))}
      </div>
      <div className="columns__ticks">
        {bins.map((bin) => (
          <span key={bin.full}>{bin.tick}</span>
        ))}
      </div>
      <details className="stats__data">
        <summary>See the counts</summary>
        <table>
          <tbody>
            {bins.map((bin) => (
              <tr key={bin.full}>
                <th scope="row">{bin.full}</th>
                <td>{bin.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function CallMap({ calls }: { calls: Story[] }) {
  const { now, openStory } = useNews();
  const [activeId, setActiveId] = useState<string | null>(null);

  const dots = useMemo(() => {
    const placed = calls
      .filter((call) => call.police!.lat && call.police!.lng)
      .map((call) => ({ call, ...mapPosition(call.police!.lat!, call.police!.lng!) }))
      .filter(({ x, y }) => x >= 0 && x <= 100 && y >= 0 && y <= 100);
    // Oldest first, so the newest calls paint on top.
    return placed.reverse();
  }, [calls]);

  function nearestDot(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - box.left;
    const pointerY = event.clientY - box.top;
    let nearest = null;
    let nearestDistance = NEAREST_DOT_PX ** 2;
    for (const dot of dots) {
      const distance = ((dot.x / 100) * box.width - pointerX) ** 2 + ((dot.y / 100) * box.height - pointerY) ** 2;
      if (distance < nearestDistance) {
        nearest = dot;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  const active = dots.find((dot) => dot.call.id === activeId);
  const tipSide = active && active.x > 68 ? " map__tip--left" : active && active.x < 32 ? " map__tip--right" : "";
  const lake = mapPosition(LAKE_LABEL.lat, LAKE_LABEL.lng);

  return (
    <figure className="stats__map">
      <figcaption className="stats__title">
        Where the calls are
        <span className="stats__sub">Toronto by police division. Each dot is one call, click one to open it.</span>
      </figcaption>
      <div
        className={active ? "map map--hot" : "map"}
        style={{ aspectRatio: divisionMap.aspect }}
        role="img"
        aria-label={`Map of Toronto's police divisions with ${dots.length} recent calls. Every call is listed below.`}
        onPointerMove={(event) => setActiveId(nearestDot(event)?.call.id ?? null)}
        onPointerLeave={() => setActiveId(null)}
        onClick={(event) => {
          const dot = nearestDot(event as unknown as PointerEvent<HTMLDivElement>);
          if (dot) openStory(dot.call);
        }}
      >
        <svg className="map__shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {divisionMap.divisions.map(({ id, path }) => (
            <path
              key={id}
              d={path}
              vectorEffect="non-scaling-stroke"
              className={active?.call.police!.division === `Division ${id.slice(1)}` ? "map__division--active" : undefined}
            />
          ))}
        </svg>
        <span className="map__lake" style={{ left: `${lake.x}%`, top: `${lake.y}%` }}>
          Lake Ontario
        </span>
        {divisionMap.divisions.map(({ id, label }) => (
          <span key={id} className="map__label" style={{ left: `${label.x}%`, top: `${label.y}%` }}>
            {id.slice(1)}
          </span>
        ))}
        {dots.map(({ call, x, y }) => (
          <span
            key={call.id}
            className={call.id === activeId ? "map__dot map__dot--active" : "map__dot"}
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
        {active && (
          <span className={`map__tip${tipSide}`} style={{ left: `${active.x}%`, top: `${active.y}%` }}>
            <b>{active.call.police!.type}</b>
            {active.call.headline.replace(`${active.call.police!.type} `, "")}
            {now !== null && ` · ${timeAgo(active.call.time, now)}`}
          </span>
        )}
      </div>
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

export default function PoliceStats() {
  const stories = useNews().feeds.police.stories;
  const stats = useMemo(() => computeStats(stories), [stories]);
  if (!stats) return null;

  const total = stats.calls.length;
  const [busiest] = stats.divisions;
  const [topType] = stats.types;

  return (
    <aside className="stats" aria-label="Police call statistics">
      <div className="stats__tiles">
        <Stat value={`${stats.averageGap.toFixed(1)} min`} label="Average time between calls" />
        <Stat value={`${Math.round(stats.longestGap)} min`} label="Longest quiet stretch" />
        <Stat value={busiest.name} label={`Busiest division, ${busiest.count} calls`} />
        <Stat value={topType.name} label={`Most reported, ${topType.count} calls`} />
      </div>

      <div className="stats__grid">
        <CallMap calls={stats.calls} />
        <RankedBars title="Most reported" items={stats.types} total={total} />
        <RankedBars title="Busiest divisions" items={stats.divisions} total={total} />
        <CallsOverTime bins={stats.bins} />
      </div>

      <p className="stats__note">
        Based on the {total} calls in the police feed, covering about the last {stats.hours}{" "}
        {stats.hours === 1 ? "hour" : "hours"}. Calls are unconfirmed reports.
      </p>
    </aside>
  );
}
