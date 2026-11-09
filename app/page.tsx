"use client";

import { useEffect, useState } from "react";

const URL =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0/query?where=1%3D1&outFields=*&orderByFields=OCCURRENCE_TIME+DESC&resultRecordCount=2000&outSR=4326&f=json";

type RawFeature = {
  attributes: {
    OBJECTID: number;
    OCCURRENCE_TIME: number;
    DIVISION: string;
    LATITUDE: number;
    LONGITUDE: number;
    CALL_TYPE_CODE: string;
    CALL_TYPE: string;
    CROSS_STREETS: string;
  }
}

type Call = {
  id: number;
  time: Date;
  division: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
};

export default function TorontoPolice() {
  const [calls, setCalls] = useState<Call[]>([]);
  useEffect(() => {
    async function loadData() {
      try {
        
        const response = await fetch(URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json(); 
        const cleaned: Call[] = data.features.map((f: RawFeature) => ({
          id: f.attributes.OBJECTID,
          time: new Date(f.attributes.OCCURRENCE_TIME),
          division: f.attributes.DIVISION,
          type: f.attributes.CALL_TYPE,
          location: f.attributes.CROSS_STREETS,
          lat: f.attributes.LATITUDE,
          lng: f.attributes.LONGITUDE,
        }));
        console.log(cleaned);
        setCalls(cleaned);
        // console.log("first record:", data.features?.[0]?.attributes);
      } catch (error) {
        console.error("error lol", error);
      }
    }
    loadData();
  }, []);

  return (
        <div>
      <h1>{calls.length} recent calls</h1>
      <ul>
        {calls.map((call) => (
          <li key={call.id}>
            {call.time.toLocaleTimeString()}: {call.type} at {call.location} ({call.division})
          </li>
        ))}
      </ul>
    </div>
  )
}