"use client";

import { useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import stations from "../lib/fireStations.json";
import type { Story } from "../lib/news";
import divisionMap from "../lib/policeDivisions.json";
import { useNews } from "./NewsShell";

const NEAREST_HALL_PX = 18;
const STATION_BY_ID = new Map(stations.map((station) => [station.id, station]));
const LAKE_LABEL = { lat: 43.625, lng: -79.25 };

// A unit like "P426" belongs to station 426. Chiefs ("C22") have no hall number.
const unitHall = (unit: string) => unit.match(/(\d{3})$/)?.[1];

function buildActivity(stories: Story[]) {
  const incidentsByHall = new Map<string, Story[]>();
  const respondingHalls = new Set<string>();
  const routes = new Map<string, { from: string; to: string }>();

  for (const story of stories) {
    const home = story.fire?.station;
    if (!home || !STATION_BY_ID.has(home)) continue;
    incidentsByHall.set(home, [...(incidentsByHall.get(home) ?? []), story]);

    for (const unit of story.fire?.units ?? []) {
      const hall = unitHall(unit);
      if (!hall || !STATION_BY_ID.has(hall)) continue;
      respondingHalls.add(hall);
      if (hall !== home) routes.set(`${hall}-${home}`, { from: hall, to: home });
    }
  }
  return { incidentsByHall, respondingHalls, routes: [...routes.values()] };
}

export default function FireMap({ compact }: { compact?: boolean }) {
  const { feeds, openStory } = useNews();
  const stories = feeds.fire.stories;
  const { incidentsByHall, respondingHalls, routes } = useMemo(() => buildActivity(stories), [stories]);
  const [activeId, setActiveId] = useState<string | null>(null);

  function nearestHall(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - box.left;
    const pointerY = event.clientY - box.top;
    let nearest = null;
    let nearestDistance = NEAREST_HALL_PX ** 2;
    for (const station of stations) {
      const distance = ((station.x / 100) * box.width - pointerX) ** 2 + ((station.y / 100) * box.height - pointerY) ** 2;
      if (distance < nearestDistance) {
        nearest = station;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  const active = activeId ? STATION_BY_ID.get(activeId) : undefined;
  const activeIncidents = activeId ? incidentsByHall.get(activeId) ?? [] : [];
  const tipSide = active && active.x > 68 ? " map__tip--left" : active && active.x < 32 ? " map__tip--right" : "";
  const { west, east, south, north } = divisionMap.bounds;
  const lakeX = ((LAKE_LABEL.lng - west) / (east - west)) * 100;
  const lakeY = ((north - LAKE_LABEL.lat) / (north - south)) * 100;

  const incidentHalls = [...incidentsByHall.keys()].flatMap((id) => STATION_BY_ID.get(id) ?? []);
  const figureClass = compact ? "fire-map stats__map--compact" : "fire-map";

  return (
    <figure className={figureClass}>
      <figcaption className="stats__title">
        Fire Map
        <span className="stats__sub">
          {compact
            ? "Each call is shown at its nearest fire hall."
            : "Each call is shown at its nearest fire hall, the only location the feed gives for every call. Click one to open it."}
        </span>
        <span className="fire-map__legend">
          <span>
            <i className="fire-map__key fire-map__key--incident" />
            Incident
          </span>
          <span>
            <i className="fire-map__key fire-map__key--hall" />
            Fire hall
          </span>
          <span>
            <i className="fire-map__key fire-map__key--route" />
            Sending units
          </span>
        </span>
      </figcaption>

      <div
        className={activeIncidents.length > 0 ? "map map--hot" : "map"}
        style={{ aspectRatio: divisionMap.aspect }}
        role="img"
        aria-label={`Map of Toronto's ${stations.length} fire halls with ${stories.length} active incidents. Every incident is listed on this page.`}
        onPointerMove={(event) => setActiveId(nearestHall(event)?.id ?? null)}
        onPointerLeave={() => setActiveId(null)}
        onClick={(event) => {
          const hall = nearestHall(event);
          const [incident] = hall ? incidentsByHall.get(hall.id) ?? [] : [];
          if (incident) openStory(incident);
        }}
      >
        <svg className="map__shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {/* Thick outlines, then fills on top, leave only the outer edge of the city. */}
          <g className="fire-map__outline">
            {divisionMap.divisions.map(({ id, path }) => (
              <path key={id} d={path} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g className="fire-map__land">
            {divisionMap.divisions.map(({ id, path }) => (
              <path key={id} d={path} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {routes.map(({ from, to }) => {
            const start = STATION_BY_ID.get(from)!;
            const end = STATION_BY_ID.get(to)!;
            return (
              <line
                key={`${from}-${to}`}
                className="fire-map__route"
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        <span className="map__lake" style={{ left: `${lakeX}%`, top: `${lakeY}%` }}>
          Lake Ontario
        </span>

        {stations.map((station) => {
          const hasIncident = incidentsByHall.has(station.id);
          const isResponding = respondingHalls.has(station.id);
          let className = "fire-map__hall";
          if (hasIncident) className += " fire-map__hall--incident";
          else if (isResponding) className += " fire-map__hall--responding";
          if (station.id === activeId) className += " fire-map__hall--active";
          return <span key={station.id} className={className} style={{ left: `${station.x}%`, top: `${station.y}%` }} />;
        })}

        {incidentHalls.map((station) => (
          <span key={station.id} className="fire-map__num" style={{ left: `${station.x}%`, top: `${station.y}%` }}>
            {station.id}
          </span>
        ))}

        {active && (
          <span className={`map__tip${tipSide}`} style={{ left: `${active.x}%`, top: `${active.y}%` }}>
            <b>
              Station {active.id}, {active.address}
            </b>
            {activeIncidents.length > 0
              ? activeIncidents.map((incident) => (
                  <span key={incident.id} className="ttc-map__note">
                    {incident.headline}
                  </span>
                ))
              : respondingHalls.has(active.id) && <span className="ttc-map__note">Units out at another call</span>}
          </span>
        )}
      </div>
    </figure>
  );
}
