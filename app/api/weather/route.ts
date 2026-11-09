const LOCATION = "latitude=43.65&longitude=-79.38&timezone=America%2FToronto";
const CACHE = { next: { revalidate: 600 } };

function describeSky(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

function describeAirQuality(aqi: number): string {
  if (aqi <= 50) return `${aqi}, good`;
  if (aqi <= 100) return `${aqi}, moderate`;
  if (aqi <= 150) return `${aqi}, poor for some`;
  if (aqi <= 200) return `${aqi}, unhealthy`;
  return `${aqi}, very unhealthy`;
}

function compass(degrees: number): string {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}

export async function GET() {
  const [weatherResponse, airResponse] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?${LOCATION}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1`,
      CACHE
    ),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${LOCATION}&current=us_aqi`, CACHE),
  ]);
  if (!weatherResponse.ok) {
    return Response.json({ error: `HTTP ${weatherResponse.status}` }, { status: 502 });
  }

  const { current, daily } = await weatherResponse.json();
  const aqi: number | undefined = airResponse.ok ? (await airResponse.json()).current?.us_aqi : undefined;

  // In order of importance, since a short box only shows the first few.
  const rows = [
    { label: "Sky", value: describeSky(current.weather_code) },
    { label: "Temperature", value: `${Math.round(current.temperature_2m)}°C` },
    { label: "Feels like", value: `${Math.round(current.apparent_temperature)}°C` },
    { label: "Wind", value: `${Math.round(current.wind_speed_10m)} km/h ${compass(current.wind_direction_10m)}` },
    { label: "Humidity", value: `${current.relative_humidity_2m}%` },
    ...(aqi === undefined ? [] : [{ label: "Air quality", value: describeAirQuality(aqi) }]),
    { label: "Gusts", value: `${Math.round(current.wind_gusts_10m)} km/h` },
    {
      label: "High / low",
      value: `${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°`,
    },
    { label: "Precipitation", value: `${current.precipitation} mm` },
  ];

  return Response.json({ rows });
}
