import { XMLParser } from "fast-xml-parser";
import type { FireEvent } from "./news";

type RawEvent = {
  prime_street?: string;
  cross_streets?: string;
  dispatch_time?: string;
  event_num: string;
  event_type?: string;
  alarm_lev?: string;
  units_disp?: string;
  beat?: string;
};

// The feed encodes blank streets as "&#x20;", which the XML parser leaves as is.
const s = (v?: string) =>
  (v ?? "").replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).trim();

export async function fetchFireEvents(init: RequestInit): Promise<FireEvent[]> {
  const response = await fetch("https://www.toronto.ca/data/fire/livecad.xml", init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();

  const parser = new XMLParser({
    parseTagValue: false,
    isArray: (name) => name === "event",
  });
  const parsed = parser.parse(xml);
  const rawEvents: RawEvent[] = parsed.tfs_active_incidents?.event ?? [];

  return rawEvents.map((e) => ({
    eventNum: e.event_num,
    type: s(e.event_type),
    street: s(e.prime_street),
    crossStreets: s(e.cross_streets),
    dispatchTime: s(e.dispatch_time),
    alarmLevel: Number(e.alarm_lev ?? 0),
    area: s(e.beat),
    units: s(e.units_disp).split(",").map((u) => u.trim()).filter(Boolean),
  }));
}
