import { XMLParser } from "fast-xml-parser";

export const dynamic = "force-dynamic";

type RawEvent = {
  prime_street?: string;
  cross_streets?: string;
  dispatch_time?: string;
  event_num: string;
  event_type?: string;
  alarm_lev?: string;
  units_disp?: string;
};

const s = (v?: string) => (v ?? "").trim();

export async function GET() {
  const response = await fetch("https://www.toronto.ca/data/fire/livecad.xml", { cache: "no-store" });
  if (!response.ok) {
    return Response.json({ error: `HTTP ${response.status}` }, { status: 502 });
  }
  const xml = await response.text();

  const parser = new XMLParser({
    parseTagValue: false,
    isArray: (name) => name === "event",
  });
  const parsed = parser.parse(xml);
  const rawEvents: RawEvent[] = parsed.tfs_active_incidents?.event ?? [];

  const events = rawEvents.map((e) => ({
    eventNum: e.event_num,
    type: s(e.event_type),
    street: s(e.prime_street),
    crossStreets: s(e.cross_streets),
    dispatchTime: s(e.dispatch_time),
    alarmLevel: Number(e.alarm_lev ?? 0),
    units: s(e.units_disp).split(",").map((u) => u.trim()).filter(Boolean),
  }));

  return Response.json(events);
}