"use client";

import { useEffect, useState } from "react";

const URL = "https://www.ttc.ca/ttcapi/routedetail//getallroutesandstopsalerts";

type RawAlert = {
  id: string;
  route: string;
  routeType: string;
  effectDesc: string;
  headerText: string;
  causeDescription: string;
  stopStart: string | null; 
  stopEnd: string | null;
  activePeriod: { start: string; end: string };
};

type Alert = {
  id: string;
  routes: string[];
  kind: string;
  effect: string;
  message: string;
  cause: string;
  between: string | null;
  start: Date;
  end: Date | null;
};

function cleanAlert(a: RawAlert): Alert {
  return {
    id: a.id,
    routes: a.route.split(","), 
    kind: a.routeType,
    effect: a.effectDesc,
    message: a.headerText,
    cause: a.causeDescription,
    between: a.stopStart && a.stopEnd ? `${a.stopStart} → ${a.stopEnd}` : null,
    start: new Date(a.activePeriod.start),
    end: a.activePeriod.end.startsWith("0001") ? null : new Date(a.activePeriod.end),
  };
}

export default function TTCAlerts() {
  const [routeAlerts, setRouteAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        console.log(data); 
        setRouteAlerts(data.routeAlerts
            .map(cleanAlert)
            .filter((a: Alert) => a.kind !== "Escalator" && a.kind !== "Elevator")
        )
      } catch (error) {
        console.error("error lol", error);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      <h1>Service alerts ({routeAlerts.length})</h1>
      <ul>
        {routeAlerts.map((a) => (
          <li key={a.id}>
            <strong>Route {a.routes.join(", ")}</strong>: {a.message}
            {a.end && <> (until {a.end.toLocaleString()})</>}
          </li>
        ))}
      </ul>
    </div>
  );
}