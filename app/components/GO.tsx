"use client";

import { useEffect, useState } from "react";
const CURRENT_CATEGORIES = ["TDELAY"];

type RawNotification = {
  SubCategory: string;
  Code: string;
  Name: string;
  MessageSubject: string;
  MessageBody: string;
  PostedDateTime: string;
};

type RawDelayedTrip = {
  DepartureTimeDisplay: string;
  HeadSign: string;
  DelayDuration: string;
  DelayReason: string;
  TripNumbers: string[];
};

type RawTrainLine = {
  CorridorName: string;
  CorridorCode: string;
  LineColour: string;
  Notifications: { Notification: RawNotification[] };
  SaagNotifications: { SaagNotification: RawDelayedTrip[] };
};


type Alert = {
  id: string;
  line: string;
  colour: string;
  category: string;
  subject: string;
  body: string;
  posted: string;
};

type DelayedTrip = {
  id: string;
  line: string;
  colour: string;
  departs: string;
  headsign: string;
  delayMinutes: number;
  reason: string;
};

// ---------- helpers ----------
// Turns messy HTML into plain text
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "") 
    .replace(/<[^>]+>/g, " ")                
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")                    
    .trim();
}

// "00:53:11" → 53
function toMinutes(duration: string): number {
  const [h, m] = duration.split(":").map(Number);
  return h * 60 + m;
}

export default function GoPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [delays, setDelays] = useState<DelayedTrip[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/go");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const lines: RawTrainLine[] = data.Trains?.Train ?? [];


setAlerts(
  lines
    .flatMap((line) =>
      (line.Notifications?.Notification ?? []).map((n, i) => ({
        id: `${line.CorridorCode}-${i}`,
        line: line.CorridorName,
        colour: line.LineColour,
        category: n.SubCategory,
        subject: n.MessageSubject,
        body: htmlToText(n.MessageBody),
        posted: n.PostedDateTime,
      }))
    )
    .filter((a) => CURRENT_CATEGORIES.includes(a.category))
);


        setDelays(
          lines.flatMap((line) =>
            (line.SaagNotifications?.SaagNotification ?? []).map((t) => ({
              id: t.TripNumbers.join("-"),
              line: line.CorridorName,
              colour: line.LineColour,
              departs: t.DepartureTimeDisplay,
              headsign: t.HeadSign,
              delayMinutes: toMinutes(t.DelayDuration),
              reason: t.DelayReason,
            }))
          )
        );
      } catch (error) {
        console.error("error lol", error);
      }
    }

    loadData();
    const timer = setInterval(loadData, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1>Delayed trains ({delays.length})</h1>
      <ul>
        {delays.map((t) => (
          <li key={t.id}>
            <span style={{ color: t.colour }}>●</span> {t.departs} {t.headsign}: {t.delayMinutes} min late
            ({t.reason})
          </li>
        ))}
      </ul>

      <h1>Train alerts ({alerts.length})</h1>
      <ul>
        {alerts.map((a) => (
          <li key={a.id}>
            <span style={{ color: a.colour }}>●</span> <strong>{a.subject}</strong>
            <p>{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}