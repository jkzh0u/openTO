export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch("https://api.metrolinx.com/external/go/serviceupdate/en/all", {
    cache: "no-store",
  });
  if (!response.ok) {
    return Response.json({ error: `HTTP ${response.status}` }, { status: 502 });
  }

  const data = await response.json();
  return Response.json(data);
}