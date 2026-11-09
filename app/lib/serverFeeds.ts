import { fetchFireEvents } from "./fireFeed";
import {
  fireStories,
  goFeed,
  newestFirst,
  POLICE_URL,
  policeStories,
  TTC_URL,
  ttcStories,
  type FeedData,
  type SectionId,
} from "./news";
import type { Feed, Feeds } from "./useNewsFeed";

const REQUEST: RequestInit = { next: { revalidate: 60 } };
const TIMEOUT_MS = 8_000;

async function getJson(url: string) {
  const response = await fetch(url, REQUEST);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// A slow or broken feed must not take the page down, so it just starts empty and
// the browser fills it in on its first poll.
async function loadFeed(section: SectionId, load: () => Promise<FeedData>): Promise<Feed> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS);
    });
    const { stories, goLines } = await Promise.race([load(), timeout]);
    return { stories: newestFirst(stories), goLines, status: "ready" };
  } catch (error) {
    console.error(`Could not load the ${section} feed on the server`, error);
    return { stories: [], status: "loading" };
  } finally {
    clearTimeout(timer);
  }
}

export function currentMinute(): number {
  return Math.floor(Date.now() / 60_000) * 60_000;
}

export async function loadInitialFeeds(): Promise<Feeds> {
  const [police, fire, ttc, go] = await Promise.all([
    loadFeed("police", async () => ({ stories: policeStories(await getJson(POLICE_URL)) })),
    loadFeed("fire", async () => ({ stories: fireStories(await fetchFireEvents(REQUEST)) })),
    loadFeed("ttc", async () => ({ stories: ttcStories(await getJson(TTC_URL)) })),
    loadFeed("go", async () => goFeed(await getJson("https://api.metrolinx.com/external/go/serviceupdate/en/all"))),
  ]);
  return { police, fire, ttc, go };
}
