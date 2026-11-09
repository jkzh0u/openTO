"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_IDS, SECTIONS } from "../lib/news";

const TORONTO = "America/Toronto";

export default function Masthead({ now }: { now: number | null }) {
  const pathname = usePathname();
  const today = now === null ? null : new Date(now);
  const current = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <header className="masthead">
      <div className="masthead__strip">
        <span>
          <a href="https://jkzhou.ca">jkzhou.ca</a>
        </span>
        <span>
          {today?.toLocaleDateString("en-CA", {
            timeZone: TORONTO,
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span>
          {today
            ? `${today.toLocaleTimeString("en-CA", { timeZone: TORONTO, hour: "numeric", minute: "2-digit" })} Toronto`
            : " "}
        </span>
      </div>
      <h1 className="masthead__name">
        <Link href="/">The OpenTO</Link>
      </h1>
      <p className="masthead__tagline">toronto&apos;s open news</p>
      <nav className="masthead__nav" aria-label="Sections">
        <Link href="/" aria-current={current("/")}>
          Front Page
        </Link>
        {SECTION_IDS.map((id) => (
          <Link key={id} href={`/${id}`} aria-current={current(`/${id}`)}>
            {SECTIONS[id].title}
          </Link>
        ))}
      </nav>
    </header>
  );
}
