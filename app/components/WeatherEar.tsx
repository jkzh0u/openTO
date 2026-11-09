"use client";

import { useEffect, useState } from "react";

const POLL_MS = 600_000;
const DETAILS = ["Feels like", "Wind", "Humidity", "Air quality"];

type Row = { label: string; value: string };

// The weather box beside the nameplate, known in newspapers as an "ear".
export default function WeatherEar() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/weather");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) setRows(data.rows);
      } catch (error) {
        console.error("Could not load the weather", error);
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!rows) return <div className="ear" />;
  const valueOf = (label: string) => rows.find((row) => row.label === label)?.value;

  return (
    <aside className="ear" aria-label="Toronto weather">
      <div className="ear__main">
        <b>{valueOf("Temperature")}</b>
        <span>{valueOf("Sky")}</span>
      </div>
      <dl className="ear__details">
        {DETAILS.map((label) => {
          const value = valueOf(label);
          return (
            value && (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            )
          );
        })}
      </dl>
    </aside>
  );
}
