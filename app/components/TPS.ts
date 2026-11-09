"use client"

import { useEffect } from "react"

const URL =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0/query?where=1%3D1&outFields=*&orderByFields=OCCURRENCE_TIME+DESC&resultRecordCount=2000&outSR=4326&f=json";

function TorontoPolice() {
    useEffect(() => {
        async function loadData() {
            try{
                const response = await fetch(URL)
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (data.error) throw new Error(data.error.message);
                console.log(data);
            } catch(error)
            {
                console.error("error lol", error);

            }
        }
    }, []);


}