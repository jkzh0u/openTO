"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { findStationIndex, MAP_HEIGHT, MAP_LINES, MAP_WIDTH, type MapStation } from "../lib/ttcMap";
import type { SubwayIssue as Issue } from "../lib/useNewsFeed";
import { useNews } from "./NewsShell";

const NEAREST_STATION_PX = 22;

type StationStatus = { closed: boolean; slow: boolean; notes: string[] };

const ALL_STATIONS = MAP_LINES.flatMap((line) => line.stations);
const stationKey = (station: Pick<MapStation, "line" | "name">) => `${station.line}:${station.name}`;

// Which stations have a problem, and what it is.
function stationStatuses(issues: Issue[]): Map<string, StationStatus> {
  const statuses = new Map<string, StationStatus>();
  for (const issue of issues) {
    const line = MAP_LINES.find((mapLine) => mapLine.id === issue.line);
    if (!line) continue;

    let indexes = issue.stations.map((name) => findStationIndex(issue.line, name)).filter((index) => index >= 0);
    if (issue.kind === "closed" && indexes.length >= 2) {
      // Closures sometimes list only the two ends, so fill in everything between.
      const [from, to] = [Math.min(...indexes), Math.max(...indexes)];
      indexes = Array.from({ length: to - from + 1 }, (_, offset) => from + offset);
    }

    for (const index of indexes) {
      const key = stationKey(line.stations[index]);
      const status = statuses.get(key) ?? { closed: false, slow: false, notes: [] };
      status.closed ||= issue.kind === "closed";
      status.slow ||= issue.kind === "slow";
      status.notes.push(issue.text);
      statuses.set(key, status);
    }
  }
  return statuses;
}

const TERMINAL_BULLETS = [
  { line: "1", x: 120, y: 9 },
  { line: "2", x: 8, y: 136 },
  { line: "4", x: 232, y: 48 },
  { line: "5", x: 34, y: 96 },
  { line: "6", x: 8, y: 46 },
];

const PLACE_LABELS = [
  { name: "Vaughan", x: 94, y: 16, anchor: "end" },
  { name: "Finch", x: 146, y: 16, anchor: "start" },
  { name: "Kipling", x: 18, y: 152, anchor: "middle" },
  { name: "Kennedy", x: 292, y: 86, anchor: "end" },
  { name: "Union", x: 146, y: 198, anchor: "start" },
] as const;

export default function TtcMiniMap() {
  const { issues, failed } = useNews().subway;
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const statuses = useMemo(() => stationStatuses(issues), [issues]);
  const slowZoneCount = issues.filter((issue) => issue.kind === "slow").length;
  const affected = ALL_STATIONS.map((station) => ({ station, status: statuses.get(stationKey(station)) })).filter(
    (entry): entry is { station: MapStation; status: StationStatus } => Boolean(entry.status)
  );
  const closed = affected.filter(({ status }) => status.closed);
  const slow = affected.filter(({ status }) => status.slow && !status.closed);

  function setNearestStation(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - box.left;
    const pointerY = event.clientY - box.top;
    let nearest: MapStation | null = null;
    let nearestDistance = NEAREST_STATION_PX ** 2;
    for (const station of ALL_STATIONS) {
      const dx = (station.x / MAP_WIDTH) * box.width - pointerX;
      const dy = (station.y / MAP_HEIGHT) * box.height - pointerY;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearest = station;
        nearestDistance = distance;
      }
    }
    setActiveKey(nearest ? stationKey(nearest) : null);
  }

  const active = ALL_STATIONS.find((station) => stationKey(station) === activeKey);
  const activeX = active ? (active.x / MAP_WIDTH) * 100 : 0;
  const tipSide = active && activeX > 68 ? " map__tip--left" : active && activeX < 32 ? " map__tip--right" : "";
  // Interchanges exist once per line, so gather the notes from all of them.
  const notes = active
    ? [
        ...new Set(
          ALL_STATIONS.filter((station) => station.name === active.name).flatMap(
            (station) => statuses.get(stationKey(station))?.notes ?? []
          )
        ),
      ]
    : [];

  const description = [
    `Subway map. ${closed.length} stations closed${closed.length ? `: ${closed.map((c) => c.station.name).join(", ")}` : ""}.`,
    `${slow.length} stations with slow zones${slow.length ? `: ${slow.map((s) => s.station.name).join(", ")}` : ""}.`,
  ].join(" ");

  return (
    <figure className="ttc-map">
      <figcaption className="ttc-map__head">
        <h3 className="ttc-map__title">Subway Map</h3>
        <span className="ttc-map__legend">
          <span>
            <svg viewBox="-5 -5 10 10" aria-hidden="true">
              <circle r="3.4" className="ttc-map__red" />
            </svg>
            Closed {closed.length}
          </span>
          <span>
            <svg viewBox="-5 -5 10 10" aria-hidden="true">
              <circle r="3.4" className="ttc-map__amber" />
            </svg>
            Slow zones {slowZoneCount}
          </span>
        </span>
      </figcaption>

      <div
        className="ttc-map__plot"
        role="img"
        aria-label={description}
        onPointerMove={setNearestStation}
        onPointerDown={setNearestStation}
        onPointerLeave={() => setActiveKey(null)}
      >
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
          {MAP_LINES.map((line) => (
            <path key={line.id} d={line.path} className="ttc-map__line" style={{ stroke: line.colour }} />
          ))}

          {ALL_STATIONS.map((station) => (
            <circle
              key={stationKey(station)}
              cx={station.x}
              cy={station.y}
              r={station.isInterchange ? 2.6 : 1.15}
              className={station.isInterchange ? "ttc-map__interchange" : "ttc-map__station"}
            />
          ))}

          {slow.map(({ station }) => (
            <circle key={stationKey(station)} cx={station.x} cy={station.y} r="3.4" className="ttc-map__amber" />
          ))}
          {closed.map(({ station }) => (
            <circle key={stationKey(station)} cx={station.x} cy={station.y} r="3.4" className="ttc-map__red" />
          ))}

          {active && <circle cx={active.x} cy={active.y} r="5" className="ttc-map__active" />}

          {TERMINAL_BULLETS.map(({ line, x, y }) => (
            <g key={line}>
              <circle cx={x} cy={y} r="6.5" style={{ fill: MAP_LINES.find((l) => l.id === line)?.colour }} />
              <text x={x} y={y + 2.9} textAnchor="middle" className={line === "1" ? "ttc-map__num ttc-map__num--dark" : "ttc-map__num"}>
                {line}
              </text>
            </g>
          ))}

          {PLACE_LABELS.map(({ name, x, y, anchor }) => (
            <text key={name} x={x} y={y} textAnchor={anchor} className="ttc-map__place">
              {name}
            </text>
          ))}
        </svg>

        {active && (
          <span
            className={`map__tip${tipSide}`}
            style={{ left: `${activeX}%`, top: `${(active.y / MAP_HEIGHT) * 100}%` }}
          >
            <b>{active.name}</b>
            {notes.map((note) => (
              <span key={note} className="ttc-map__note">
                {note}
              </span>
            ))}
          </span>
        )}
      </div>

      {failed && <p className="ttc-map__error">Live status unavailable.</p>}
    </figure>
  );
}
