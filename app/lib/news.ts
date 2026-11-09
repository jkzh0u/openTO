export type SectionId = "police" | "fire" | "ttc" | "go";

export type Story = {
  // Must stay the same between polls, because a new id is what makes a story "breaking".
  id: string;
  section: SectionId;
  headline: string;
  summary: string;
  time: Date;
  facts: { label: string; value: string }[];
  goLine?: { name: string; colour: string; textColour: string };
  mapUrl?: string;
  delayMinutes?: number;
  police?: { type: string; division: string; lat: number | null; lng: number | null };
  ttc?: {
    label: string;
    isLine: boolean;
    background: string;
    color: string;
    status: TtcStatus;
    effect: string;
    detail: string | null;
    inEffect: boolean;
  };
};

export type TtcStatus = "ok" | "closed" | "detour" | "delay";

export const SECTION_IDS: SectionId[] = ["police", "fire", "ttc", "go"];

export const SECTIONS: Record<
  SectionId,
  { title: string; kicker: string; byline: string; empty: string; note?: string }
> = {
  police: {
    title: "Police",
    kicker: "Calls for service",
    byline: "our police scanner",
    empty: "Not a single call. Everyone is behaving.",
    note: "Calls for service are unconfirmed reports, not findings of fact.",
  },
  fire: {
    title: "Fire",
    kicker: "Active incidents",
    byline: "a reporter standing well back",
    empty: "Nothing is on fire. Yet.",
    note: "Alarm levels 2 and up count pumpers, aerials, rescues and squads. Support vehicles such as hazmat, air lights, chiefs and command vehicles are not included.",
  },
  ttc: {
    title: "TTC",
    kicker: "When is there no alerts?",
    byline: "a commuter on a shuttle bus",
    empty: "No service alerts. Frame this page.",
  },
  go: {
    title: "GO Transit",
    kicker: "Schedule sold separately",
    byline: "someone still on the platform",
    empty: "All trains on time. Please verify.",
  },
};

// ---------- text and time helpers ----------

function titleCase(text: string): string {
  return text.toLowerCase().replace(/(^|[\s/(-])([a-z])/g, (_, gap, letter) => gap + letter.toUpperCase());
}

// Turns messy HTML into plain text
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// For feeds that give Toronto wall-clock times. The TTC labels its times with a
// "Z", but they are local: an alert saying "starting 11 p.m." has a start of 23:00Z.
function parseLocalTime(value: string): Date {
  const usFormat = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (.*)$/);
  const iso = usFormat ? `${usFormat[3]}-${usFormat[1]}-${usFormat[2]}T${usFormat[4]}` : value;
  const date = new Date(iso.replace(" ", "T").replace(/Z$/, ""));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date, now: number): string {
  const minutes = Math.floor((now - date.getTime()) / 60_000);
  if (minutes < -1) return `Starts ${formatDateTime(date)}`;
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function compactFacts(facts: [string, string | null | undefined][]): Story["facts"] {
  return facts.filter(([, value]) => value).map(([label, value]) => ({ label, value: value as string }));
}

async function getJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ---------- Toronto Police ----------

const POLICE_URL =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0/query?where=1%3D1&outFields=*&orderByFields=OCCURRENCE_TIME+DESC&resultRecordCount=2000&outSR=4326&f=json";

type RawPoliceCall = {
  attributes: {
    OCCURRENCE_TIME: number;
    DIVISION: string;
    LATITUDE: number;
    LONGITUDE: number;
    CALL_TYPE_CODE: string;
    CALL_TYPE: string;
    CROSS_STREETS: string;
  };
};

async function loadPolice(): Promise<Story[]> {
  const data = await getJson(POLICE_URL);
  return data.features.map(({ attributes: a }: RawPoliceCall): Story => {
    const type = titleCase(a.CALL_TYPE);
    // Some calls have blank streets, which arrive as " - ".
    const location = a.CROSS_STREETS.split(" - ")
      .map((street) => titleCase(street.trim()))
      .filter(Boolean)
      .join(" & ");
    const division = a.DIVISION.replace(/^D/, "Division ");
    const time = new Date(a.OCCURRENCE_TIME);
    return {
      // OBJECTID is only a row number in this feed, so build the id from the call itself.
      id: `police-${a.OCCURRENCE_TIME}-${a.CALL_TYPE_CODE}-${a.CROSS_STREETS}-${a.DIVISION}`,
      section: "police",
      police: { type, division, lat: a.LATITUDE, lng: a.LONGITUDE },
      headline: location ? `${type} at ${location}` : `${type} in ${division}`,
      summary: `Officers from ${division} were called${location ? ` to ${location}` : ""} for a report of: ${type.toLowerCase()}.`,
      time,
      facts: compactFacts([
        ["Call type", type],
        ["Call code", a.CALL_TYPE_CODE],
        ["Location", location],
        ["Division", division],
        ["Reported", formatDateTime(time)],
      ]),
      mapUrl: a.LATITUDE && a.LONGITUDE ? `https://www.google.com/maps?q=${a.LATITUDE},${a.LONGITUDE}` : undefined,
    };
  });
}

// ---------- Toronto Fire ----------

type FireEvent = {
  eventNum: string;
  type: string;
  street: string;
  crossStreets: string;
  dispatchTime: string;
  alarmLevel: number;
  area: string;
  units: string[];
};

export const ALARM_LEVELS = [
  { level: 0, meaning: "Initial response (for any event)" },
  { level: 1, meaning: "Support fire response" },
  { level: 2, meaning: "10-14 emergency vehicles" },
  { level: 3, meaning: "15-18 emergency vehicles" },
  { level: 4, meaning: "19-22 emergency vehicles" },
  { level: 5, meaning: "23-28 emergency vehicles" },
  { level: 6, meaning: "29-32 emergency vehicles" },
];

export const UNIT_TYPES: Record<string, string> = {
  P: "Pumper",
  R: "Rescue",
  A: "Aerial",
  T: "Tower",
  PL: "Platform",
  S: "Squad",
  HR: "Highrise",
  HZ: "HazMat",
  FB: "Fireboat",
  CMD: "Command Vehicle",
  C: "Chief",
  LA: "Air Light",
  TRS: "Trench Rescue Support",
  WT: "Water Tanker",
  HS: "Haz Support",
  SUP7: "Canteen vehicle",
  BOX12: "Canteen vehicle",
  DE: "Decon",
  MP: "Mini Pumper",
  FI: "Fire Investigator",
};

function describeAlarm(level: number): string {
  const entry = ALARM_LEVELS.find((alarm) => alarm.level === level);
  return entry ? `${level}: ${entry.meaning}` : String(level);
}

function unitType(unit: string): string {
  const code = unit.toUpperCase();
  return UNIT_TYPES[code] ?? UNIT_TYPES[code.replace(/\d+$/, "")] ?? "Other";
}

// "P312", "P314", "A331" → "Pumper: P312, P314" and "Aerial: A331", one type per line
function describeUnits(units: string[]): string {
  const byType = new Map<string, string[]>();
  for (const unit of units) {
    const type = unitType(unit);
    byType.set(type, [...(byType.get(type) ?? []), unit]);
  }
  return [...byType].map(([type, codes]) => `${type}: ${codes.join(", ")}`).join("\n");
}

function cleanFireStreet(street: string): string {
  // Medical calls only give a postal area, like "M6K". Streets end in a district code, like ", TT".
  return /^[A-Z]\d[A-Z]$/.test(street) ? street : titleCase(street.replace(/,\s*[A-Z]{2}$/, ""));
}

async function loadFire(): Promise<Story[]> {
  const events: FireEvent[] = await getJson("/api/fire");
  return events.map((e): Story => {
    const street = cleanFireStreet(e.street);
    const cross = titleCase(e.crossStreets).replace(" / ", " and ");
    const isPostalArea = /^[A-Z]\d[A-Z]$/.test(street);
    const type = /^medical$/i.test(e.type) ? "Medical call" : e.type.replace(" - ", ": ");
    const alarm = e.alarmLevel > 0 ? `${e.alarmLevel}-alarm ` : "";
    const place = street ? `${isPostalArea ? "in" : "on"} ${street}` : cross ? `near ${cross}` : "at an undisclosed location";
    const destination = isPostalArea ? `the ${street} area` : street ? street : cross ? cross : "an undisclosed location";
    const unitCount = `${e.units.length} ${e.units.length === 1 ? "unit" : "units"}`;
    const time = parseLocalTime(e.dispatchTime);
    return {
      id: `fire-${e.eventNum}`,
      section: "fire",
      headline: `${alarm}${type} ${place}`,
      summary: `Toronto Fire sent ${unitCount} to ${destination}${cross && street ? `, between ${cross}` : ""}.`,
      time,
      facts: compactFacts([
        ["Incident type", type],
        ["Alarm level", describeAlarm(e.alarmLevel)],
        ["Street", street],
        ["Cross streets", cross],
        ["Nearest station", e.area ? `Station ${e.area}` : null],
        ["Dispatched", formatDateTime(time)],
        ["Units dispatched", describeUnits(e.units)],
        ["Event number", e.eventNum],
      ]),
    };
  });
}

// ---------- TTC ----------

const TTC_URL = "https://www.ttc.ca/ttcapi/routedetail//getallroutesandstopsalerts";

type RawTtcAlert = {
  id: string;
  route: string;
  routeType: string;
  effectDesc: string;
  headerText: string;
  causeDescription: string;
  direction: string | null;
  stopStart: string | null;
  stopEnd: string | null;
  activePeriod: { start: string; end: string };
  childAlerts?: { startTime: string; endTime: string }[] | null;
};

// Planned work is often listed for days but only runs in nightly windows.
function ttcAlertInEffect(a: RawTtcAlert, start: Date, end: Date | null): boolean {
  const now = Date.now();
  if (a.childAlerts?.length) {
    return a.childAlerts.some(
      (child) => parseLocalTime(child.startTime).getTime() <= now && now <= parseLocalTime(child.endTime).getTime()
    );
  }
  return start.getTime() <= now && (end === null || now <= end.getTime());
}

const SUBWAY_LINE_COLOURS: Record<string, { background: string; color: string }> = {
  "1": { background: "#f8c300", color: "#1b1712" },
  "2": { background: "#00923f", color: "#ffffff" },
  "4": { background: "#a21a68", color: "#ffffff" },
  "5": { background: "#ee8a2d", color: "#ffffff" },
  "6": { background: "#8d8e90", color: "#ffffff" },
};

function ttcStatus(effect: string): TtcStatus {
  if (/regular|normal/i.test(effect)) return "ok";
  if (/clos|no service|out of service|suspend/i.test(effect)) return "closed";
  if (/detour|diversion/i.test(effect)) return "detour";
  return "delay";
}

// The newest alert that is really a problem: the feed also posts "Regular service" all-clears.
export function currentTtcDisruption(stories: Story[], now: number | null): Story | null {
  return activeTtcDisruptions(stories, now)[0] ?? null;
}

export function activeTtcDisruptions(stories: Story[], now: number | null): Story[] {
  const isActive = (story: Story) => now === null || story.time.getTime() <= now + 60_000;
  return stories.filter((story) => story.ttc?.status !== "ok" && story.ttc?.inEffect && isActive(story));
}

async function loadTTC(): Promise<Story[]> {
  const data = await getJson(TTC_URL);
  return data.routeAlerts
    .filter((a: RawTtcAlert) => a.routeType !== "Escalator" && a.routeType !== "Elevator")
    .map((a: RawTtcAlert): Story => {
      const routes = a.route.split(",").join(", ");
      const firstRoute = a.route.split(",")[0];
      const lineColours = a.routeType === "Subway" ? SUBWAY_LINE_COLOURS[firstRoute] : undefined;
      const label = `${a.routeType === "Subway" ? "Line" : "Route"} ${routes}`;
      const start = parseLocalTime(a.activePeriod.start);
      const end = a.activePeriod.end.startsWith("0001") ? null : parseLocalTime(a.activePeriod.end);
      return {
        id: `ttc-${a.id}`,
        section: "ttc",
        headline: `${label}: ${a.effectDesc}`,
        summary: a.headerText,
        time: start,
        ttc: {
          label: firstRoute,
          isLine: Boolean(lineColours),
          ...(lineColours ?? { background: "#d9271e", color: "#ffffff" }),
          status: ttcStatus(a.effectDesc),
          inEffect: ttcAlertInEffect(a, start, end),
          effect: a.effectDesc,
          detail:
            a.stopStart && a.stopEnd
              ? a.stopStart === a.stopEnd
                ? `At ${a.stopStart}`
                : `${a.stopStart} to ${a.stopEnd}`
              : null,
        },
        facts: compactFacts([
          [a.route.includes(",") ? "Routes" : "Route", routes],
          ["Service", a.routeType],
          ["Effect", a.effectDesc],
          ["Cause", a.causeDescription],
          ["Direction", a.direction],
          ["Between", a.stopStart && a.stopEnd && a.stopStart !== a.stopEnd ? `${a.stopStart} → ${a.stopEnd}` : null],
          ["At", a.stopStart && a.stopStart === a.stopEnd ? a.stopStart : null],
          ["Starts", formatDateTime(start)],
          ["Ends", end ? formatDateTime(end) : "Until further notice"],
        ]),
      };
    });
}

// ---------- GO Transit ----------

const GO_ALERT_CATEGORIES = ["TDELAY"];

type RawGoNotification = {
  SubCategory: string;
  MessageSubject: string;
  MessageBody: string;
  PostedDateTime: string;
};

type RawGoDelayedTrip = {
  DepartureTimeDisplay: string;
  ArrivalTimeTimeDisplay: string;
  Direction: string;
  HeadSign: string;
  DelayDuration: string;
  DelayReason: string;
  Status: string;
  PostedDateTime: string;
  TripNumbers: string[];
};

type RawGoLine = {
  CorridorName: string;
  CorridorCode: string;
  LineColour: string;
  Notifications: { Notification: RawGoNotification[] | null } | null;
  SaagNotifications: { SaagNotification: RawGoDelayedTrip[] | null } | null;
};

// "00:53:11" → "53 min", "01:12:00" → "1 hr 12 min"
function formatDelay(duration: string): string {
  const [hours, minutes] = duration.split(":").map(Number);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

function goLineHeading(line: RawGoLine): NonNullable<Story["goLine"]> {
  const colour = /^#[0-9a-f]{6}$/i.test(line.LineColour) ? line.LineColour : "#0a6b35";
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(colour.slice(start, start + 2), 16));
  const isLight = (red * 299 + green * 587 + blue * 114) / 1000 > 150;
  return { name: line.CorridorName, colour, textColour: isLight ? "#1b1712" : "#ffffff" };
}

async function loadGO(): Promise<FeedData> {
  const data = await getJson("/api/go");
  const lines: RawGoLine[] = data.Trains?.Train ?? [];

  const delays = lines.flatMap((line) =>
    (line.SaagNotifications?.SaagNotification ?? []).map((t): Story => {
      const delay = formatDelay(t.DelayDuration);
      const time = parseLocalTime(t.PostedDateTime);
      return {
        id: `go-delay-${line.CorridorCode}-${t.DepartureTimeDisplay}-${t.TripNumbers.join("-")}`,
        section: "go",
        delayMinutes: Number(t.DelayDuration.split(":")[0]) * 60 + Number(t.DelayDuration.split(":")[1]),
        headline: `${t.DepartureTimeDisplay} train running ${delay} late`,
        summary: `${t.HeadSign}.${t.DelayReason ? ` Reason given: ${t.DelayReason}.` : ""}`,
        time,
        goLine: goLineHeading(line),
        facts: compactFacts([
          ["Line", line.CorridorName],
          ["Trip", t.HeadSign],
          ["Train", t.TripNumbers.join(", ")],
          ["Departure", t.DepartureTimeDisplay],
          ["Arrival", t.ArrivalTimeTimeDisplay],
          ["Direction", titleCase(t.Direction)],
          ["Delay", delay],
          ["Reason", t.DelayReason],
          ["Status", t.Status],
        ]),
      };
    })
  );

  const alerts = lines.flatMap((line) =>
    (line.Notifications?.Notification ?? [])
      .filter((n) => GO_ALERT_CATEGORIES.includes(n.SubCategory))
      .map((n): Story => {
        const time = parseLocalTime(n.PostedDateTime);
        return {
          // Not the posted time, because Metrolinx bumps that whenever an alert is edited.
          id: `go-alert-${line.CorridorCode}-${n.MessageSubject}`,
          section: "go",
          // Subjects repeat the line name that the heading already shows.
          headline: n.MessageSubject.replace(`${line.CorridorName} - `, ""),
          summary: htmlToText(n.MessageBody),
          time,
          goLine: goLineHeading(line),
          facts: compactFacts([
            ["Line", line.CorridorName],
            ["Posted", formatDateTime(time)],
          ]),
        };
      })
  );

  return { stories: [...delays, ...alerts], goLines: lines.map(goLineHeading) };
}

export type GoLine = NonNullable<Story["goLine"]>;
export type FeedData = { stories: Story[]; goLines?: GoLine[] };

export const LOADERS: Record<SectionId, () => Promise<FeedData>> = {
  police: async () => ({ stories: await loadPolice() }),
  fire: async () => ({ stories: await loadFire() }),
  ttc: async () => ({ stories: await loadTTC() }),
  go: loadGO,
};
