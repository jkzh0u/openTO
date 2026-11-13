import { activeTtcDisruptions, SECTIONS, type SectionId, type Story } from "../../lib/news";
import { loadInitialFeeds } from "../../lib/serverFeeds";
import { SITE_URL } from "../../lib/site";

// A small summary of every feed for embedding on other sites, such as the portfolio's
// projects page. The feeds themselves are cached for a minute by loadInitialFeeds.
export const dynamic = "force-dynamic";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

type WidgetSection = {
  id: SectionId;
  title: string;
  // null while a feed is down, so the widget can show a dash instead of a wrong zero.
  value: string | null;
  label: string;
  href: string;
  latest: { headline: string; time: string } | null;
};

function latest(story: Story | undefined): WidgetSection["latest"] {
  return story ? { headline: story.headline, time: story.time.toISOString() } : null;
}

export async function GET() {
  const feeds = await loadInitialFeeds();
  const now = Date.now();
  const ready = (id: SectionId) => feeds[id].status === "ready";
  const section = (id: SectionId, value: string, label: string, story: Story | undefined): WidgetSection => ({
    id,
    title: SECTIONS[id].title,
    value: ready(id) ? value : null,
    label,
    href: `${SITE_URL}/${id}`,
    latest: ready(id) ? latest(story) : null,
  });

  const police = feeds.police.stories.filter((story) => now - story.time.getTime() <= 3_600_000);
  const ttc = activeTtcDisruptions(feeds.ttc.stories, now);
  const goLive = feeds.go.stories.filter((story) => !story.goScheduled);
  const worstGo = goLive.reduce<Story | undefined>(
    (worst, story) => ((story.delayMinutes ?? 0) > (worst?.delayMinutes ?? 0) ? story : worst),
    undefined
  );

  const sections = [
    section("police", String(police.length), "calls in the last hour", feeds.police.stories[0]),
    section("fire", String(feeds.fire.stories.length), "active incidents", feeds.fire.stories[0]),
    section("ttc", String(ttc.length), "service disruptions", ttc[0]),
    section("go", `${worstGo?.delayMinutes ?? 0} min`, "worst train delay", worstGo ?? goLive[0]),
  ];

  return Response.json({ updatedAt: new Date(now).toISOString(), url: SITE_URL, sections }, { headers: HEADERS });
}
