import { fetchFireEvents } from "../../lib/fireFeed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await fetchFireEvents({ cache: "no-store" }));
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 502 });
  }
}
