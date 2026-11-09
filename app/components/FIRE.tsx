"use client";

import { useEffect, useState } from "react";

type FireEvent = {
  eventNum: string;
  type: string;
  street: string;
  crossStreets: string;
  dispatchTime: string;
  alarmLevel: number;
  units: string[];
  active: boolean;
};

export default function FirePage() {
  const [events, setEvents] = useState<FireEvent[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/fire");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: FireEvent[] = await response.json();
        console.log(data);
        setEvents(data);
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
<h1>Active fire incidents ({events.length})</h1>
<ul>
  {events.map((e) => (
    <li key={e.eventNum}>
      {e.dispatchTime.replace("T", " ")}: {e.type} at {e.street || e.crossStreets} ({e.units.length} units)
    </li>
  ))}
</ul>
    </div>
  );
}