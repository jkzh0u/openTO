type RawAlert = {
  route: string;
  routeType: string;
  effectDesc: string;
  stopStart: string | null;
  stopEnd: string | null;
  stopIDList: string[] | null;
  direction: string | null;
  reducedSpeed: string | null;
  activePeriod: { start: string; end: string };
  childAlerts: { startTime: string; endTime: string }[] | null;
};

// The TTC labels Toronto wall-clock times with a "Z", so compare them as plain text
// against the current Toronto time. This stays correct on a server running in UTC.
const wallClock = (value: string) => value.slice(0, 19).replace("T", " ");

function isInEffect(alert: RawAlert, now: string): boolean {
  const windows = alert.childAlerts?.length
    ? alert.childAlerts.map((child) => [child.startTime, child.endTime])
    : [[alert.activePeriod.start, alert.activePeriod.end]];
  return windows.some(([start, end]) => {
    const isOpenEnded = end.startsWith("0001");
    return wallClock(start) <= now && (isOpenEnded || now <= wallClock(end));
  });
}

export async function GET() {
  const response = await fetch("https://alerts.ttc.ca/api/alerts/live-alerts", { next: { revalidate: 60 } });
  if (!response.ok) {
    return Response.json({ error: `HTTP ${response.status}` }, { status: 502 });
  }

  const data = await response.json();
  const alerts: RawAlert[] = data.routes ?? [];
  const now = new Date().toLocaleString("sv-SE", { timeZone: "America/Toronto" });

  const issues = alerts
    .filter((alert) => (alert.routeType === "Subway" || alert.routeType === "LRT") && isInEffect(alert, now))
    .flatMap((alert) => {
      const isSlow = /reduced speed zone/i.test(alert.effectDesc);
      const isClosed = /clos|no service|suspend|bypass/i.test(alert.effectDesc);
      if (!isSlow && !isClosed) return [];

      const direction = alert.direction?.split(" ")[0].toLowerCase();
      return [
        {
          kind: isSlow ? "slow" : "closed",
          line: alert.route,
          stations: alert.stopIDList?.length ? alert.stopIDList : [alert.stopStart, alert.stopEnd].filter(Boolean),
          text: isSlow
            ? `Slow zone ${direction ?? ""}${alert.reducedSpeed ? `, ${alert.reducedSpeed} km/h` : ""}`
            : `Closed, ${alert.stopStart} to ${alert.stopEnd}`,
        },
      ];
    });

  return Response.json({ issues });
}
