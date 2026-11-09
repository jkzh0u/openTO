"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LOADERS, SECTION_IDS, type GoLine, type SectionId, type Story } from "./news";

const POLL_MS = 60_000;
const MAX_BREAKING = 20;

export type Feed = { stories: Story[]; goLines?: GoLine[]; status: "loading" | "ready" | "error" };
export type Feeds = Record<SectionId, Feed>;

const LOADING: Feed = { stories: [], status: "loading" };
const INITIAL_FEEDS: Feeds = { police: LOADING, fire: LOADING, ttc: LOADING, go: LOADING };

function newestFirst(stories: Story[]): Story[] {
  const unique = [...new Map(stories.map((story) => [story.id, story])).values()];
  return unique.sort((a, b) => b.time.getTime() - a.time.getTime());
}

export function useNewsFeed() {
  const [feeds, setFeeds] = useState(INITIAL_FEEDS);
  const [breaking, setBreaking] = useState<Story[]>([]);

  useEffect(() => {
    let cancelled = false;
    const seen: Partial<Record<SectionId, Set<string>>> = {};

    async function poll(section: SectionId) {
      try {
        const { stories: loaded, goLines } = await LOADERS[section]();
        const stories = newestFirst(loaded);
        if (cancelled) return;

        // A feed's first successful load only records what already exists, so opening
        // the page (or a feed recovering from an outage) doesn't flag everything as new.
        const known = seen[section];
        const fresh = known ? stories.filter((story) => !known.has(story.id)) : [];
        seen[section] = new Set([...(known ?? []), ...stories.map((story) => story.id)]);

        setFeeds((current) => ({ ...current, [section]: { stories, goLines, status: "ready" } }));
        if (fresh.length > 0) {
          setBreaking((current) => [...fresh, ...current].slice(0, MAX_BREAKING));
        }
      } catch (error) {
        console.error(`Could not load the ${section} feed`, error);
        if (!cancelled) {
          setFeeds((current) => ({ ...current, [section]: { ...current[section], status: "error" } }));
        }
      }
    }

    const pollAll = () => SECTION_IDS.forEach(poll);
    pollAll();
    const timer = setInterval(pollAll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return { feeds, breaking };
}

export type SubwayIssue = { kind: "closed" | "slow"; line: string; stations: string[]; text: string };

export function useSubwayIssues() {
  const [issues, setIssues] = useState<SubwayIssue[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/ttc-subway");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        setIssues(data.issues);
        setLoaded(true);
        setFailed(false);
      } catch (error) {
        console.error("Could not load the subway status", error);
        if (!cancelled) setFailed(true);
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return useMemo(() => ({ issues, loaded, failed }), [issues, loaded, failed]);
}

function subscribeToClock(onTick: () => void) {
  const timer = setInterval(onTick, 15_000);
  return () => clearInterval(timer);
}

// The current time rounded to the minute, or null while server rendering.
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribeToClock,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null
  );
}
